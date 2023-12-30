import {
	WebSocketGateway,
	SubscribeMessage,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat/chat.service';
import { IChatQuery } from '../chat/models/ChatQuery';
import { UserService } from 'src/user/user.service';
import { forwardRef, Inject } from '@nestjs/common';
import { INotification } from 'src/user/models/User';
import { UserEntity, UserStatus } from 'src/user/entities/user.entity';

@WebSocketGateway({ cors: true })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() io: Server = new Server();

	waitingUsers: UserEntity[] = [];

	disconnectMap: Map<string, NodeJS.Timeout> = new Map();

	constructor(
		@Inject(forwardRef(() => ChatService))
		private readonly chatService: ChatService,
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService,
	) {}

	// As soon as a sockets connect to the server this is called, related to "connection" event
	async handleConnection(client: Socket, ...args: any[]) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
			{ channels: true },
		);
		if (!user) return client.emit('invalid_token');

		clearTimeout(this.disconnectMap[client.handshake.auth.token]);
		this.disconnectMap.delete(client.handshake.auth.token);

		if (user.user_status == UserStatus.OFFLINE)
			await this.userService.updateUserStatus(user, UserStatus.ONLINE);
		else await this.userService.updateUserStatus(user, user.user_status);
		this.chatService.connect(user, client);
	}

	// As soon as a socket disconnect this function is called, related to "disconnection" event
	async handleDisconnect(client: Socket) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);
		if (!user) return client.emit('invalid_token');

		this.disconnectMap[client.handshake.auth.token] = setTimeout(
			async () => {
				await this.userService.updateUserStatus(
					user,
					UserStatus.OFFLINE,
				);
			},
			5000,
		);
	}

	/********************************
	 *  EVENT HANDLERS				*
	 ********************************/
	@SubscribeMessage('chat')
	async chatHandler(client: Socket, data: IChatQuery) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);
		if (!user) return client.emit('invalid_token');
		data.user = user.user_id;
		try {
			await this.chatService.handleMessage(data);
		} catch (e) {
			this.error(e, user.user_id);
		}
	}

	@SubscribeMessage('update_channel')
	async updateChat(client: Socket, data: any) {
		await this.chatService.updateChanImage(data.channel_id, data.image);
	}

	@SubscribeMessage('notifs')
	async notifsHandler(client: Socket, data: INotification) {
		const sender = await this.userService.findByToken(
			client.handshake.auth.token,
		);
		if (!sender) return client.emit('invalid_token');
		try {
			await this.userService.handleNotif(data, sender);
		} catch (e) {
			this.error(e, sender.user_id);
		}
	}

	@SubscribeMessage('cancelSearchGame')
	async cancelSearchGame(client: Socket) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);

		if (!user) return client.emit('invalid_token');

		await this.userService.updateUserStatus(user, UserStatus.ONLINE);
		this.waitingUsers = this.waitingUsers.filter((el) => {
			return el.user_id != user.user_id;
		});
	}

	@SubscribeMessage('logout')
	async logout(client: Socket) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);
		if (!user) return client.emit('invalid_token');
		await this.userService.updateUserStatus(user, UserStatus.OFFLINE);
	}

	// --------------------------------------------------------------------------
	emit(event: string, data: any, to: string = null) {
		if (to) this.io.to(to).emit(event, data);
		else this.io.emit(event, data);
	}

	join(user: string, channel: string) {
		this.io.in(user).socketsJoin(channel);
	}

	leave(user: string, channel: string) {
		this.io.in(user).socketsLeave(channel);
	}

	error(errorMsg: string, to: string | Socket) {
		if (typeof to == 'string')
			return this.io
				.to(this.chatService.userRoomPrefix + to)
				.emit('error', errorMsg);
		to.emit('error', errorMsg);
	}
}
