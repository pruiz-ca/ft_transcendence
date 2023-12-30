import {
	forwardRef,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
} from '@nestjs/common';
import { IBaseUser, INotification, IUpdateUserInfo } from './models/User';
import { InjectRepository } from '@nestjs/typeorm';
import {
	AdminAction,
	UserEntity,
	UserRole,
	UserStatus,
} from './entities/user.entity';
import { Repository } from 'typeorm';
import { RelationService } from './relation.service';
import { RelationStatus, RelationType } from './entities/relation.entity';
import { GameService } from 'src/game/game.service';
import { GameEntity } from 'src/game/match.entity';
import { AppGateway } from 'src/app/app.gateway';
import { ChatService } from 'src/chat/chat.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { getChannelDto } from 'src/chat/models/channel.dto';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private userRepository: Repository<UserEntity>,
		@Inject(forwardRef(() => RelationService))
		private relationService: RelationService,
		@Inject(forwardRef(() => GameService))
		private gameService: GameService,
		@Inject(forwardRef(() => AppGateway))
		private readonly appGateway: AppGateway,
		@Inject(forwardRef(() => ChatService))
		private readonly chatService: ChatService,
		private httpService: HttpService,
	) {}

	async deleteUserAccount(user_id: string) {
		const user = await this.findById(user_id, { channels: true });
		this.appGateway.emit('expelled', null, 'u/' + user.user_id);

		// Leave channels
		try {
			this.chatService.removeUser(user);
		} catch (e) {}
		this.appGateway.emit('delete_user', { user_id: user.user_id });

		if (user.is_banned)
			throw new HttpException(
				{ status: HttpStatus.UNAUTHORIZED, error: 'user is banned' },
				HttpStatus.UNAUTHORIZED,
			);
		await this.userRepository.delete(user_id);
		return user;
	}

	async getAll(): Promise<UserEntity[]> {
		return this.userRepository.find();
	}

	private async findUser(
		where: any,
		options: { channels?: boolean; blocks?: boolean } = undefined,
	): Promise<UserEntity> {
		const relations = [];
		if (options?.channels)
			relations.push(
				...[
					'channels',
					'channels.channel',
					'channels.channel.messages',
					'channels.channel.users',
					'channels.channel.users.user',
				],
			);
		if (options?.blocks)
			relations.push(
				...['received_relations', 'received_relations.receiver'],
			);
		return this.userRepository.findOne({
			where: where,
			relations: relations,
		});
	}

	async findByUsername(
		username: string,
		options: { channels?: boolean } = undefined,
	): Promise<UserEntity> {
		return this.findUser(
			{ username: username },
			{ channels: options?.channels },
		);
	}

	async findByToken(
		token: string,
		options: { channels: boolean } = undefined,
	): Promise<UserEntity> {
		return this.findUser({ token: token }, options);
	}

	async findById(
		id: string,
		options: {
			ft_id?: boolean;
			channels?: boolean;
			blocks?: boolean;
		} = undefined,
	): Promise<UserEntity> {
		return this.findUser(
			options?.ft_id ? { ft_id: id } : { user_id: id },
			options,
		);
	}

	async getAllById(ids: number[]) {
		return this.userRepository.findByIds(ids);
	}

	async createNewUser(user): Promise<UserEntity> {
		let role = UserRole.REGULAR;
		const username = user.username;
		const tmp = await this.findByUsername(username);

		if (
			user.username === 'rorozco-' ||
			user.username === 'mmunoz-f' ||
			user.username === 'pruiz-ca'
		) {
			role = UserRole.OWNER;
		}
		const newUser: IBaseUser = {
			ft_id: user.ft_id,
			username: '',
			avatar: user.avatar,
			is_banned: false,
			score: 0,
			victories: 0,
			losses: 0,
			ladder_lvl: 0,
			two_fa: false,
			user_status: UserStatus.ONLINE,
			user_role: role,
		};
		const savedUser = await this.userRepository.save(newUser);
		savedUser.username = tmp
			? 'user' + savedUser.user_id.slice(0, 5)
			: user.username;
		return this.userRepository.save(savedUser);
	}

	async getUserBlocks(user: UserEntity): Promise<string[]> {
		return (await this.relationService.getUserBlocked(user)).map(
			(block) => block.user_id,
		);
	}

	async clearChannels(user: UserEntity): Promise<getChannelDto[]> {
		const channels: getChannelDto[] = [];
		for (const rawChannel of user.channels) {
			const channel = await this.chatService.getChannel(
				rawChannel.channel.channel_id,
				['users', 'users.user', 'messages'],
			);
			await this.chatService.clearBlocks(user, channel);
			channels.push(channel.toDto());
		}
		return channels;
	}

	async updateUserProfile(
		user: UserEntity,
		newInfo: IUpdateUserInfo,
	): Promise<UserEntity> {
		user.username = newInfo.username;
		user.avatar = newInfo.avatar;
		await this.userRepository.save(user);
		return user;
	}

	async storeTwoFaSecret(username: string, secret: string) {
		return this.userRepository.update(
			{ username: username },
			{ two_fa_secret: secret },
		);
	}

	async toggleTwoFactorAuth(user: UserEntity, on: boolean) {
		user.two_fa = on;
		return this.userRepository.save(user);
	}

	async storeJwtToken(user: UserEntity, token: string) {
		user.token = token;
		return this.userRepository.save(user);
	}

	async sendNotif(data: INotification, sender: UserEntity) {
		const type =
			data.type == 'friend' ? RelationType.FRIEND : RelationType.GAME;
		const req = await this.relationService.sendRequest(
			data.receiver,
			sender,
			type,
		);
		if (!req) return;
		const receiver = req.receiver;
		this.appGateway.emit('received_request', req, 'u/' + receiver.user_id);
	}

	async respondNotif(notif: INotification, user: UserEntity) {
		if (notif.action == 'remove') {
			const receiver = await this.findById(notif.receiver);
			const req = await this.relationService.removeRequest(
				receiver,
				user,
				RelationType.FRIEND,
			);
			this.appGateway.emit(
				'remove_request',
				req,
				'u/' + req.sender.user_id,
			);
			this.appGateway.emit(
				'remove_request',
				req,
				'u/' + req.receiver.user_id,
			);
		} else if (
			(notif.action == 'accept' || notif.action == 'decline') &&
			notif.type != 'challenge'
		) {
			const status =
				notif.action == 'accept'
					? RelationStatus.ACCEPTED
					: RelationStatus.DECLINED;
			const req = await this.relationService.respondRequest(
				notif.request_id,
				status,
			);
			if (!req) return;
			this.appGateway.emit(
				`${notif.action.toString()}_friend`,
				req,
				'u/' + req.sender.user_id,
			);
			this.appGateway.emit(
				`${notif.action.toString()}_friend`,
				req,
				'u/' + req.receiver.user_id,
			);
			this.appGateway.emit(
				`${notif.action.toString()}_request`,
				req,
				'u/' + req.sender.user_id,
			);
			this.appGateway.emit(
				`${notif.action.toString()}_request`,
				req,
				'u/' + req.receiver.user_id,
			);
		} else if (notif.type == 'challenge' && notif.action == 'accept') {
			const req = await this.relationService.respondRequest(
				notif.request_id,
				RelationStatus.ACCEPTED,
			);
			const other =
				user.user_id === req.receiver.user_id
					? req.sender
					: req.receiver;
			const game = await this.gameService.createGame(user, other, false);
			await this.relationService.removeRequest(
				req.receiver,
				req.sender,
				req.relation_type,
			);
			if (!game) {
				this.appGateway.emit(
					'decline_request',
					req,
					'u/' + req.sender.user_id,
				);
				this.appGateway.emit(
					'decline_request',
					req,
					'u/' + req.receiver.user_id,
				);
				return;
			}
			this.appGateway.emit(
				'accept_request',
				req,
				'u/' + req.sender.user_id,
			);
			this.appGateway.emit(
				'accept_request',
				req,
				'u/' + req.receiver.user_id,
			);
			this.appGateway.emit(
				'matchmaking',
				{ game: game, event: { ranked: false, powerups: false } },
				'u/' + req.sender.user_id,
			);
			this.appGateway.emit(
				'matchmaking',
				{ game: game, event: { ranked: false, powerups: false } },
				'u/' + req.receiver.user_id,
			);
		} else if (notif.type == 'challenge' && notif.action == 'decline') {
			const req = await this.relationService.getRequest(notif.request_id);
			const other =
				req.receiver.user_id === user.user_id
					? req.sender
					: req.receiver;
			const data = await this.relationService.removeRequest(
				other,
				user,
				RelationType.GAME,
			);
			this.appGateway.emit(
				'decline_request',
				data,
				'u/' + data.sender.user_id,
			);
			this.appGateway.emit(
				'decline_request',
				data,
				'u/' + data.receiver.user_id,
			);
		}
	}

	async handleNotif(data: INotification, user: UserEntity) {
		switch (data.action) {
			case 'send':
				await this.sendNotif(data, user);
			case 'accept':
			case 'decline':
			case 'remove':
				await this.respondNotif(data, user);
		}
	}

	async updateUserGameInfo(userId: string, score: number, won: boolean) {
		const user = await this.findById(userId);
		user.score += score;
		if (won) user.victories++;
		else user.losses++;
		await this.userRepository.save(user);
	}

	async updateUserStatus(user: UserEntity, status: UserStatus) {
		user.user_status = status;
		return this.userRepository.save(user);
	}

	async isGameOngoing(player1: string, player2: string) {
		const user1 = await this.findById(player1);
		const user2 = await this.findById(player2);

		const gamesUser1: GameEntity[] =
			await this.gameService.getUserUnfinishedGames(user1);
		const gamesUser2: GameEntity[] =
			await this.gameService.getUserUnfinishedGames(user2);

		if (gamesUser1.length > 0 || gamesUser2.length > 0) {
			return true;
		}
		return false;
	}

	async urlExists(url: string) {
		const ret = await firstValueFrom(this.httpService.head(url));
		if (ret.status != 404) return true;
		else return false;
	}

	async toggleBan(user: UserEntity, action: any) {
		if (user.user_role == UserRole.OWNER) return null;
		if (action == 'ban') user.is_banned = true;
		else if (action == 'unban') user.is_banned = false;
		return this.userRepository.save(user);
	}

	async toggleAdmin(user: UserEntity, action: any) {
		if (user.user_role == UserRole.OWNER) return null;
		if (action == 'admin') user.user_role = UserRole.ADMIN;
		else if (action == 'unadmin') user.user_role = UserRole.REGULAR;
		return this.userRepository.save(user);
	}

	async exerciseAdminRights(user: UserEntity, action: AdminAction) {
		switch (action) {
			case 'ban':
			case 'unban':
				return this.toggleBan(user, action);
			case 'admin':
			case 'unadmin':
				return this.toggleAdmin(user, action);
		}
	}
}
