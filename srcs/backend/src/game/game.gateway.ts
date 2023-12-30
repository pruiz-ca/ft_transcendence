/* eslint-disable indent */
import { Logger } from '@nestjs/common';
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from 'src/chat/chat.service';
import { UserEntity, UserStatus } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Keys } from '../game/classes/utilities';
import { GameService } from './game.service';

/*
 * Socket messages:
 * 		Listen:
 * 			- startGame: creates a new game
 * 			- stopGame: deletes the game
 *			- keyPress: sends the game info to the client
 *		Emit:
 *			- gameInfo: sends the game info to the client
 */

@WebSocketGateway({ cors: true })
export class GameGateway
	implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
	@WebSocketServer() io: Server = new Server();

	private logger: Logger = new Logger('Game');

	private normalQueue: UserEntity[] = [];

	private rankedQueue: UserEntity[] = [];

	private normalPUQueue: UserEntity[] = [];

	private rankedPUQueue: UserEntity[] = [];

	private userClientId: Map<string, string> = new Map();

	constructor(
		private gameService: GameService,
		private readonly chatService: ChatService,
		private readonly userService: UserService,
	) {}

	afterInit() {
		this.logger.log(' => Game Server initiated!');
		this.gameService.mainServerLoop(this.io);
	}

	async handleConnection(client: Socket) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);
		if (!user) return;
		const id = user.user_id;
		this.logger.log('[' + id.slice(0, 5) + ']' + ' Connection');
		if (this.gameService.mapClientTimer[id]) {
			clearTimeout(this.gameService.mapClientTimer[id]);
		}
	}

	async handleDisconnect(client: Socket) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);
		if (!user) return;
		const id = user.user_id;
		await this.handleStop(client);
		this.logger.log('[' + id.slice(0, 5) + ']' + ' Disconnection');
	}

	@SubscribeMessage('startGame')
	async handleStart(client: Socket, payload: any): Promise<void> {
		const roomId = payload.roomId;
		const game = await this.gameService.create(
			this.io,
			client,
			roomId,
			payload.event,
		);
		try {
			await this.chatService.joinGameChannel(client, game);
		} catch (e) {}
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);
		if (!user) return;
		const id = user.user_id;
		this.logger.log(
			'[' + id.slice(200, 205) + ']' + ' Join Game @' + roomId,
		);
	}

	@SubscribeMessage('stopGame')
	async handleStop(client: Socket) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);
		if (!user) return;
		const id = user.user_id;
		this.logger.log('[' + id.slice(0, 5) + ']' + ' Stop game');
		await this.gameService.remove(this.io, client);
	}

	@SubscribeMessage('keyPress')
	async movePlayer(client: Socket, keys: Keys) {
		await this.gameService.keyPress(client, keys);
	}

	async matchPlayers(queue: UserEntity[], user: UserEntity, payload: any) {
		queue.push(user);
		if (queue.length >= 2) {
			if (queue.at(0).user_status !== UserStatus.ONLINE) {
				queue.shift();
				return;
			}
			if (queue.at(1).user_status !== UserStatus.ONLINE) {
				queue.splice(1, 1);
				return;
			}

			const user1 = queue.shift();
			const user2 = queue.shift();
			const game = await this.gameService.createGame(
				user1,
				user2,
				payload.ranked,
			);

			if (!game) {
				this.logger.log('[MatchMaking] User is already playing a game');
				this.io
					.to(this.userClientId[user1.user_id])
					.to(this.userClientId[user2.user_id])
					.emit('matchmaking', {
						error: 'User is already playing a game',
					});
				return;
			}

			this.logger.log('[MatchMaking] Found a game! Starting...');

			this.io
				.to(this.userClientId[user1.user_id])
				.to(this.userClientId[user2.user_id])
				.emit('matchmaking', { game: game, event: payload });
		}
	}

	@SubscribeMessage('searchGame')
	async searchGame(client: Socket, payload: any) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);

		if (!user || this.normalQueue.find((el) => el.user_id == user.user_id))
			return;

		this.logger.log(
			'[MatchMaking] ' + user.username + ' is waiting for a game',
		);

		this.userClientId[user.user_id] = client.id;
		if (payload.ranked && payload.powerups) {
			this.matchPlayers(this.rankedPUQueue, user, payload);
		} else if (payload.ranked && !payload.powerups) {
			this.matchPlayers(this.rankedQueue, user, payload);
		} else if (!payload.ranked && payload.powerups) {
			this.matchPlayers(this.normalPUQueue, user, payload);
		} else if (!payload.ranked && !payload.powerups) {
			this.matchPlayers(this.normalQueue, user, payload);
		}
	}

	@SubscribeMessage('cancelSearchGame')
	async cancelSearchGame(client: Socket) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);

		if (!user) return;

		await this.userService.updateUserStatus(user, UserStatus.ONLINE);

		this.userClientId.delete(user.user_id);

		this.normalQueue = this.normalQueue.filter((el) => {
			return el.user_id != user.user_id;
		});

		this.rankedQueue = this.rankedQueue.filter((el) => {
			return el.user_id != user.user_id;
		});

		this.normalPUQueue = this.normalPUQueue.filter((el) => {
			return el.user_id != user.user_id;
		});

		this.rankedPUQueue = this.rankedPUQueue.filter((el) => {
			return el.user_id != user.user_id;
		});

		return;
	}
}
