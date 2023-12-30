import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Channel } from './models/Channel';
import { IChatQuery, Cmd, Modes } from './models/ChatQuery';
import { UserService } from 'src/user/user.service';
import { AppGateway } from 'src/app/app.gateway';
import { ChannelRepository } from './repositories/channel.repository';
import { ChannelSubscriptionRepository } from './repositories/channel_subscription.repository';
import { UserEntity } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { ChatMessageEntity } from './entities/message.entity';
import { SubType } from './entities/channel_subscription.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from '@nestjs/class-validator';
import { ChannelType } from './entities/channel.entity';
import { RelationService } from 'src/user/relation.service';
import { Game } from 'src/game/classes/game';

@Injectable()
export class ChatService {
	// prefixes for socket.io rooms
	readonly userRoomPrefix = 'u/';

	readonly channelRoomPrefix = 'c/';

	// relation bettwen the command id and the subscription type
	private readonly subTypes: { id: Modes; value: SubType }[] = [
		{ id: Modes.ADMIN, value: SubType.ADMIN },
		{ id: Modes.BAN, value: SubType.BAN },
		{ id: Modes.DEFAULT, value: SubType.DEFAULT },
	];

	constructor(
		@Inject(forwardRef(() => AppGateway))
		private readonly appGateway: AppGateway,
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService,
		@Inject(forwardRef(() => RelationService))
		private readonly relationsService: RelationService,

		private readonly channelRepository: ChannelRepository,
		private readonly subRepository: ChannelSubscriptionRepository,
		@InjectRepository(ChatMessageEntity)
		private readonly msgRepository: Repository<ChatMessageEntity>,
	) {
		Channel.channelRepository = this.channelRepository;
		Channel.subsRepository = this.subRepository;
		Channel.messageRepository = this.msgRepository;
		Channel.gateway = this.appGateway;
	}

	// Returns all channels
	async getChannels(relations?: string[]): Promise<Channel[]> {
		const channels: Channel[] = [];
		const entities = (
			await this.channelRepository.find({
				where: {},
				relations: relations,
			})
		).filter(
			(channel) =>
				channel.type != ChannelType.PERSONAL &&
				channel.type != ChannelType.GAME,
		);
		for (const channel of entities) channels.push(new Channel(channel));
		return channels;
	}

	// Return the channel identified by id
	async getChannel(
		channelId: string,
		relations?: string[],
	): Promise<Channel | null> {
		let channelEntity;
		if (isUUID(channelId))
			channelEntity = await this.channelRepository.findOne({
				where: { channel_id: channelId },
				relations: relations,
			});
		else
			channelEntity = await this.channelRepository.findOne({
				where: { name: channelId },
				relations: relations,
			});
		if (channelEntity) return new Channel(channelEntity);
		return null;
	}

	async clearBlocks(user: UserEntity, channel: Channel) {
		const blocks = await this.relationsService.getUserBlocked(user);
		channel.clearMessages(blocks.map((e) => e.user_id));
	}

	// Creates a new channel
	async createChannel(
		name: string,
		type: ChannelType,
		password: string = null,
	): Promise<Channel> {
		let channel: Channel;
		channel = new Channel(
			await this.channelRepository.createChannel(
				type == ChannelType.PERSONAL ? '' : name,
				type,
				password,
			),
		);

		if (channel.type == ChannelType.DEFAULT)
			this.appGateway.emit('channel-creation', channel.id);
		return channel;
	}

	// Fully erase channel
	async eraseChannel(channelId: string): Promise<void> {
		const channel = await this.getChannel(channelId);
		if (!channel) return;

		await channel.delete();
		this.appGateway.emit('channel-removed', channelId);
	}

	async joinGameChannel(client: Socket, game: Game) {
		let channel: Channel = await this.getChannel(`game${game.roomId}`, [
			'users',
			'users.user',
		]);
		if (!channel && game.p1 && game.p2) {
			channel = await this.createChannel(
				`game${game.roomId}`,
				ChannelType.GAME,
			);
			await this.setGameChannel(channel, game);
			return;
		}

		if (!channel || channel.users.length < 2) return;

		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);
		await channel.addUser(user);
	}

	async setGameChannel(channel: Channel, game: Game) {
		const player1 = await this.userService.findById(game.p1.id);
		const player2 = await this.userService.findById(game.p2.id);
		if (!player1 || !player2) return;
		try {
			await channel.addUser(player1);
			await channel.setSubMode(player1, SubType.OWNER);
			await channel.addUser(player2);
			await channel.setSubMode(player2, SubType.OWNER);
		} catch (e) {}
	}

	// Join the socket to all the user rooms
	connect(user: UserEntity, socket: Socket) {
		socket.join(this.userRoomPrefix + user.user_id);
		if (!user.channels) return;
		for (const sub of user.channels) {
			// Wont subscribe tu banned channels
			if (sub.type == SubType.BAN) continue;

			socket.join(this.channelRoomPrefix + sub.channel.channel_id);
		}
	}

	// Removes user from all its ative channels
	async removeUser(user: UserEntity) {
		for (const channel of user.channels) {
			const current = await this.getChannel(channel.channel.channel_id, [
				'users',
				'users.user',
			]);
			await current.removeUser(user);
		}
	}

	private async message(from: string, to: string, msg: string) {
		const channel = await this.getChannel(to, ['users', 'users.user']);
		if (!channel) return;

		await channel.sendMessage(msg, from);
	}

	private async join(userId: string, targetId: string, args: any[]) {
		let created = false;
		const user = await this.userService.findById(userId);
		if (!user || userId == targetId) throw 'could not join';

		let channel = await this.getChannel(targetId, [
			'users',
			'users.user',
			'messages',
		]);

		if (!channel) {
			// For user blocks
			if (args[1] == ChannelType.PERSONAL) {
				const secondUser = await this.userService.findById(targetId);
				if (!secondUser) throw 'user no longer exists';

				if (
					(await this.relationsService.getUserBlocked(user)).find(
						(block) => block.user_id == secondUser.user_id,
					) ||
					(
						await this.relationsService.getUserBlocked(secondUser)
					).find((block) => block.user_id == user.user_id)
				) {
					throw 'you can not chat with this user';
				}
			}

			channel = await this.createChannel(targetId, args[1], args[0]);
			created = true;
		}

		if (
			channel.password &&
			(args == null || !(await channel.checkPassword(args[0])))
		)
			throw 'incorrect password';

		if (
			created != true &&
			channel.type != ChannelType.DEFAULT &&
			channel.type != ChannelType.GAME
		)
			throw 'could not join';

		await channel.addUser(user);
		if (created) channel.setSubMode(user, SubType.OWNER);

		// Add the second user for personal channels
		if (
			channel.type == ChannelType.PERSONAL ||
			channel.type == ChannelType.GAME
		) {
			const secondUser = await this.userService.findById(targetId);
			if (!secondUser) throw 'user no longer exists';
			// For user blocks

			await channel.addUser(secondUser);
			await channel.setSubMode(secondUser, SubType.OWNER);
		}
	}

	private async leave(userId: string, channelId: string) {
		const user = await this.userService.findById(userId);
		const channel = await this.getChannel(channelId, [
			'users',
			'users.user',
			'messages',
		]);
		if (!user || !channel) throw 'could not leave';

		await channel.removeUser(user);
	}

	// First value of args is the mode, the second is an aditional parameter such as target/password
	private async mode(adminId: string, channelName: string, args: string[]) {
		const channel = await this.getChannel(channelName, [
			'users',
			'users.user',
			'messages',
		]);
		if (!channel || !channel.isAdmin(adminId)) throw 'need permisions';

		if (args[0] == Modes.PASSWORD || args[0] == Modes.PRIVATE) {
			await channel.modeChannel(args);
			return this.appGateway.emit('update', channel.toDto());
		}

		const user = await this.userService.findById(args[1]);
		if (!user) throw 'user no longer exists';

		if (channel.isOwner(user.user_id)) return 'no permisions';

		if (args[0] == Modes.KICK)
			return this.leave(user.user_id, channel.name);
		await channel.setSubMode(
			user,
			this.subTypes.find((type) => type.id == args[0])!.value,
		);
	}

	// redirects the command requested by the client to its function
	async handleMessage(chatQuery: IChatQuery) {
		switch (chatQuery.cmd) {
			case Cmd.MSG:
				await this.message(
				chatQuery.user,
				chatQuery.target,
				chatQuery.args[0],
			);
				break;
			case Cmd.JOIN:
				await this.join(
				chatQuery.user,
				chatQuery.target,
				chatQuery.args,
			);
				break;
			case Cmd.PART:
				await this.leave(chatQuery.user, chatQuery.target);
				break;
			case Cmd.MODE:
				await this.mode(
				chatQuery.user,
				chatQuery.target,
				chatQuery.args,
			);
				break;
		}
	}

	async updateChanImage(channel_id: string, image: string) {
		const channel = await this.channelRepository.findOne(channel_id);
		channel.avatar = image;
		return this.channelRepository.save(channel);
	}
}
