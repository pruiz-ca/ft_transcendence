import { ChannelEntity, ChannelType } from '../entities/channel.entity';
import { ChannelRepository } from '../repositories/channel.repository';
import {
	ChannelSubscriptionEntity,
	SubType,
} from '../entities/channel_subscription.entity';
import { ChannelSubscriptionRepository } from '../repositories/channel_subscription.repository';
import { UserEntity } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { ChatMessageEntity } from '../entities/message.entity';
import { Modes } from './ChatQuery';
import { getChannelDto } from './channel.dto';
import { AppGateway } from 'src/app/app.gateway';
import { entityToDTO } from 'src/user/models/User';
import * as bcrypt from 'bcryptjs';

export class Channel {
	static channelRepository: ChannelRepository;

	static subsRepository: ChannelSubscriptionRepository;

	static messageRepository: Repository<ChatMessageEntity>;

	static gateway: AppGateway;

	// prefixes for socket.io rooms
	private readonly userRoomPrefix = 'u/';

	private readonly channelRoomPrefix = 'c/';

	id: string;

	name: string;

	avatar: string;

	type: ChannelType;

	private _password: string | null;

	users: ChannelSubscriptionEntity[];

	entity: ChannelEntity;

	messages: ChatMessageEntity[];

	constructor(channelEntity: ChannelEntity) {
		this.id = channelEntity.channel_id;
		this.name = channelEntity.name;
		this.avatar = channelEntity.avatar;
		this.type = channelEntity.type;
		this._password = channelEntity.password;
		this.users = channelEntity.users;
		this.messages = channelEntity.messages;
		this.entity = channelEntity;
	}

	get password() {
		if (!this._password || !this._password.length) return null;
		return this._password;
	}

	async delete() {
		await Channel.channelRepository.removeChannel(this.entity);
		Channel.gateway.emit('channel-removed', this.id);
		Channel.gateway.emit('left', this.id, this.channelRoomPrefix + this.id);
		Channel.gateway.io.socketsLeave(this.channelRoomPrefix + this.id);
	}

	async addUser(user: UserEntity) {
		const member = this.users.find(
			(member) => member.user.user_id == user.user_id,
		);
		if (member) throw 'could not join';

		const sub = await Channel.subsRepository.join(this.entity, user);
		this.users.push(sub);

		Channel.gateway.emit(
			'joined',
			this.id,
			this.userRoomPrefix + user.user_id,
		);
		Channel.gateway.join(
			this.userRoomPrefix + user.user_id,
			this.channelRoomPrefix + this.id,
		);
		this.updateMembers();
	}

	async removeUser(user: UserEntity) {
		const member = this.users.find(
			(member) => member.user.user_id == user.user_id,
		);
		if (!member || member.type == SubType.BAN) throw 'could not leave';

		if (
			this.users.length > 1 &&
			(member.type == SubType.ADMIN || member.type == SubType.OWNER)
		)
			if (
				!this.users.some(
					(sub) =>
						sub != member &&
						(sub.type == SubType.ADMIN ||
							sub.type == SubType.OWNER),
				)
			)
				throw 'there must be at least one admin on the channel before you leave';

		await Channel.subsRepository.leave(this.entity, user);
		this.users.splice(
			this.users.findIndex(
				(member) => member.user.user_id == user.user_id,
			),
			1,
		);

		Channel.gateway.emit(
			'left',
			this.id,
			this.userRoomPrefix + user.user_id,
		);
		Channel.gateway.leave(
			this.userRoomPrefix + user.user_id,
			this.channelRoomPrefix + this.id,
		);
		this.updateMembers();

		// Channel is erased if not enough members
		if (this.type == ChannelType.PERSONAL || !this.users.length)
			this.delete();
	}

	async sendMessage(msg: string, from: string) {
		const sub = this.users.find((member) => member.user.user_id == from);
		if (!sub || sub.type == SubType.BAN)
			throw 'user does not belong to channel';

		const msgEntity = new ChatMessageEntity();
		msgEntity.channel_id = this.id;
		msgEntity.channel = this.entity;
		msgEntity.from_id = sub.user.user_id;
		msgEntity.from_name = sub.user.username;
		msgEntity.text = msg;
		await Channel.messageRepository.save(msgEntity);

		const data = { text: msg, fromId: sub.user.user_id, fromUsername: sub.user.username, to: this.id };
		Channel.gateway.emit('message', data, this.channelRoomPrefix + this.id);
	}

	isOwner(userId: string) {
		return this.users.some(
			(sub) => sub.user.user_id == userId && sub.type == SubType.OWNER,
		);
	}

	isAdmin(userId: string) {
		return this.users.some(
			(sub) =>
				sub.user.user_id == userId &&
				(sub.type == SubType.ADMIN || sub.type == SubType.OWNER),
		);
	}

	async changePassword(password: string) {
		if (this.type == ChannelType.GAME || this.type == ChannelType.PERSONAL)
			throw 'could not change password';
		this._password = await Channel.channelRepository.changePassword(
			this.entity,
			password,
		);
		this.update();
	}

	async checkPassword(passw: string) {
		return await bcrypt.compare(passw, this.password);
	}

	async modeChannel(args: string[]) {
		if (args[0] == Modes.PASSWORD) this.changePassword(args[1]);
		else if (
			args[0] == Modes.PRIVATE &&
			this.type != ChannelType.PERSONAL &&
			this.type != ChannelType.GAME
		)
			this.type =
				args[1] == 'true' ? ChannelType.PRIVATE : ChannelType.DEFAULT;
		this.update();
	}

	async setSubMode(user: UserEntity, value: SubType) {
		const member = this.users.find(
			(sub) => sub.user.user_id == user.user_id,
		);
		if (!member) throw 'not a channel member';

		if (value == SubType.DEFAULT && member.type == SubType.BAN) {
			await Channel.subsRepository.leave(this.entity, user);
			this.users.splice(
				this.users.findIndex(
					(member) => member.user.user_id == user.user_id,
				),
				1,
			);
			this.update();
			return;
		}

		await Channel.subsRepository.setValue(this.entity, user, value);
		member.type = value;
		if (value != SubType.BAN) {
			this.update();
			return;
		}

		Channel.gateway.leave(
			this.userRoomPrefix + user.user_id,
			this.channelRoomPrefix + this.id,
		);
		Channel.gateway.emit(
			'left',
			this.id,
			this.userRoomPrefix + user.user_id,
		);
		this.update();
	}

	async update() {
		await Channel.channelRepository.updateChannel(this);
		this.updateMembers();
	}

	updateMembers() {
		Channel.gateway.emit(
			'update',
			{ channel: this.toDto() },
			this.channelRoomPrefix + this.id,
		);
	}

	// Deletes the messages of this intante made by the userId passed, used for blocked users by others
	clearMessages(users: string[]) {
		this.messages = this.messages.filter(
			(msg) => !users.includes(msg.from_id),
		);
	}

	toDto(): getChannelDto {
		return {
			id: this.id,
			name: this.name,
			avatar: this.avatar,
			type: this.type,
			hasPassword: this._password? true : false,
			users: this.users?.map(sub => { return {  user_id: sub.user.user_id! , ...entityToDTO(sub.user), subtype: sub.type } }),
			messages: this.messages?.sort((msg1, msg2) => msg1.message_id - msg2.message_id).map(msg => {
				const sender  = this.users.find(sub => sub.user.user_id == msg.from_id)
				return { fromId: sender ? sender.user.user_id : '', fromUsername: sender? sender.user.username : msg.from_name, text: msg.text } 
			}),
		};
	}
}
