/* eslint-disable import/no-unresolved */
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Server, Socket } from 'socket.io';
import { AppGateway } from 'src/app/app.gateway';
import { ChatService } from 'src/chat/chat.service';
import { UserEntity, UserStatus } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { Config } from './classes/config';
import { Game } from './classes/game';
import { Keys } from './classes/utilities';
// import { ModGame } from './Game';
import { GameEntity } from './match.entity';

/*
 * Two maps are made to retrieve the game given a roomId, and the roomId given
 * a userId.
 * Positions are emitted as volatile to mimic UDP
 */
@Injectable()
export class GameService {
	public logger: Logger = new Logger('Game');

	public mapRoomGame = new Map<string, Game>();

	public mapClientRoom = new Map<string, string>();

	public mapClientTimer = new Map<string, NodeJS.Timer>();

	constructor(
		@InjectRepository(GameEntity)
		private gameRepository: Repository<GameEntity>,
		@Inject(forwardRef(() => AppGateway))
		private readonly appGateway: AppGateway,
		@InjectRepository(UserEntity)
		private userRepository: Repository<UserEntity>,
		@Inject(forwardRef(() => UserService))
		private userService: UserService,
		@Inject(forwardRef(() => ChatService))
		private chatService: ChatService,
	) {
		Game.gameRepository = gameRepository;
		Game.userRepository = userRepository;
	}

	async getAll(): Promise<GameEntity[]> {
		return this.gameRepository.find();
	}

	async getById(id: string): Promise<GameEntity> {
		return this.gameRepository.findOne({
			where: [{ game_id: id }],
			relations: ['player1', 'player2'],
		});
	}

	async createGame(
		player1: UserEntity,
		player2: UserEntity,
		isRanked: boolean,
	) {
		const tmp = await this.userService.isGameOngoing(
			player1.user_id,
			player2.user_id,
		);
		if (tmp) return;
		if (player1.user_id === player2.user_id) return;
		const game: GameEntity = {
			player1_score: 0,
			player2_score: 0,
			player1: player1,
			player2: player2,
			is_ranked: isRanked,
			is_finished: false,
			winner_id: '',
		};
		await this.userService.updateUserStatus(player1, UserStatus.PLAYING);
		await this.userService.updateUserStatus(player2, UserStatus.PLAYING);
		const newGame = await this.gameRepository.save(game);
		this.appGateway.emit('create_game', newGame);
		return newGame;
	}

	async getUserGames(user: UserEntity): Promise<GameEntity[]> {
		return this.gameRepository.find({
			where: [
				{ player1: user, is_finished: true },
				{ player2: user, is_finished: true },
			],
			relations: ['player1', 'player2'],
		});
	}

	async getUserUnfinishedGames(user: UserEntity): Promise<GameEntity[]> {
		return this.gameRepository.find({
			where: [
				{ player1: user, is_finished: false },
				{ player2: user, is_finished: false },
			],
			relations: ['player1', 'player2'],
		});
	}

	async getAllLiveGames() {
		return this.gameRepository.find({
			where: [{ is_finished: false }],
			relations: ['player1', 'player2'],
		});
	}

	mainServerLoop(io: Server) {
		setInterval(() => {
			this.mapRoomGame.forEach((game) => {
				if (game.p1 !== undefined && game.p2 !== undefined) {
					game.update(io);
					io.in(game.roomId).volatile.emit('gameInfo', {
						posBall: game.ball.position,
						posP1: game.p1.position,
						posP2: game.p2.position,
					});
					if (game.isGameOver) {
						this.chatService.eraseChannel(`game${game.roomId}`);
						io.in(game.roomId).emit('gameOver');

						this.remove(io, undefined, game);

						game.saveGame(io).then((g) => {
							this.appGateway.emit('delete_game', g.game_id);
						});
					}
				}
			});
		}, 1000 / 60);
	}

	/*
	 * If the room doesn't exist creates a new game and adds the player
	 */
	async create(io: Server, client: Socket, roomId: string, event: any) {
		const token = client.handshake.auth.token;
		const user = await this.userService.findByToken(token);
		const id = user.user_id;

		if (!io.sockets.adapter.rooms.get(roomId)) {
			const config = new Config();
			if (event.powerups) {
				const random = Math.floor(Math.random() * 3) + 1;

				if (random === 1) config.halvePlayers();
				if (random === 2) config.doubleSpeed();
				if (random === 3) config.invertControls();
			}

			this.logger.log('[' + id.slice(0, 5) + ']' + ' Created ' + roomId);
			this.mapRoomGame.set(roomId, new Game(roomId, config));
		}
		client.join(roomId);
		this.mapClientRoom.set(id, roomId);
		this.mapRoomGame.get(roomId).addPlayer(id);
		io.to(roomId).emit(
			'gameConfig',
			this.mapRoomGame.get(roomId).conf.pHeight,
		);
		return this.mapRoomGame.get(roomId);
	}

	/*
	 * Removes the client from the game and if the client is not an spectator,
	 * deletes the game.
	 */
	async remove(io: Server, client?: Socket, game?: Game) {
		if (game) {
			const roomId = game.roomId;
			io.to(roomId).emit('gameOver');
			this.mapRoomGame.delete(roomId);
		} else if (client) {
			const user = await this.userService.findByToken(
				client.handshake.auth.token,
			);
			const id = user.user_id;
			const roomId = this.mapClientRoom.get(id);

			if (this.mapRoomGame.get(roomId)) {
				const p1 = this.mapRoomGame.get(roomId).p1;
				const p2 = this.mapRoomGame.get(roomId).p2;
				const p1Disconnect = p1 && p1.id === id;
				const p2Disconnect = p2 && p2.id === id;

				if (p1Disconnect || p2Disconnect) {
					this.mapClientTimer[id] = setTimeout(() => {
						io.to(roomId).emit('gameOver');
						this.mapRoomGame.delete(roomId);
						io.socketsLeave(roomId);
						this.mapClientRoom.delete(id);
						this.getById(roomId).then((g) => {
							g.is_finished = true;

							if (p1Disconnect) {
								g.winner_id = g.player2.user_id;
								g.player1_score = 0;
								g.player2_score = 10;
							} else {
								g.winner_id = g.player1.user_id;
								g.player1_score = 10;
								g.player2_score = 0;
							}
							this.gameRepository.save(g);
						});

						const playerOnline = p1Disconnect ? p2.id : p1.id;

						this.userRepository
							.findOne(playerOnline)
							.then((user) => {
								user.user_status = UserStatus.ONLINE;
								this.userRepository.save(user);
							});
					}, 10000);
				} else {
					client.leave(roomId);
					this.mapClientRoom.delete(id);
				}
			}
		}
	}

	sendScores(io: Server, roomId: string) {
		const game = this.mapRoomGame.get(roomId);

		io.to(roomId).emit('getScores', {
			scoreP1: game.p1.score,
			scoreP2: game.p2.score,
		});
	}

	async keyPress(client: Socket, keys: Keys) {
		const user = await this.userService.findByToken(
			client.handshake.auth.token,
		);
		const id = user.user_id;
		const roomId = this.mapClientRoom.get(id);
		const game = this.mapRoomGame.get(roomId);

		if (game) {
			if (game.p1.id === id) {
				game.p1.keys = keys;
			} else if (game.p2.id === id) {
				game.p2.keys = keys;
			}
		}
	}
}
