import { Ball } from './ball';
import { Player } from './player';
// import * as conf from './config';
import { Server } from 'socket.io';
import { MoreThan, Repository } from 'typeorm';
import { GameEntity } from '../match.entity';
import { UserEntity, UserStatus } from 'src/user/entities/user.entity';
import { Config } from './config';
import { UserService } from 'src/user/user.service';

export class Game {
	static gameRepository: Repository<GameEntity>;

	static userRepository: Repository<UserEntity>;

	private readonly userService: UserService;

	constructor(
		public roomId: string,
		public conf: Config,
		public p1: Player = undefined,
		public p2: Player = undefined,
		public ball: Ball = undefined,
		public mode = 0,
		public isGameOver = true,
		public p1Tout: NodeJS.Timeout = undefined,
		public p2Tout: NodeJS.Timeout = undefined,
		public countDown: boolean = true,
	) {
		this.kickOff();
		this.ball = new Ball(this.conf);
	}

	addPlayer(clientId: string) {
		if (this.p1 === undefined) {
			this.p1 = new Player(clientId, this.conf, 1);
			clearTimeout(this.p1Tout);
		} else if (this.p2 === undefined) {
			this.p2 = new Player(clientId, this.conf, 2);
			clearTimeout(this.p2Tout);
		}
	}

	update(io: Server): void {
		this.movePlayers();
		this.moveBall(io);
		this.checkScore(io);

		const p1Won = this.p1.score >= this.conf.maxScore;
		const p2Won = this.p2.score >= this.conf.maxScore;
		if (p1Won || p2Won) {
			this.isGameOver = true;
		}
	}

	movePlayers(): void {
		this.p1.move();
		this.p2.move();
	}

	moveBall(io: Server): void {
		this.ball.move();
		const playerHit = this.ball.bouncePlayers(this.p1, this.p2);
		if (playerHit !== 0) {
			io.to(this.roomId).emit('playerHit', playerHit);
		}
		this.ball.bounceWalls();
	}

	checkScore(io: Server): void {
		if (this.ball.position.x > this.conf.screenWidth) {
			this.p1.incrementScore();
			io.to(this.roomId).emit('score', {
				scoreP1: this.p1.score,
				scoreP2: this.p2.score,
			});
			this.restartGame(1);
		} else if (this.ball.position.x < 0) {
			this.p2.incrementScore();
			io.to(this.roomId).emit('score', {
				scoreP1: this.p1.score,
				scoreP2: this.p2.score,
			});
			this.restartGame(2);
		}
	}

	async saveGame(io: Server) {
		const p1Won = this.p1.score >= this.conf.maxScore;
		let isRanked = false;

		const game = await Game.gameRepository.findOne({
			where: { game_id: this.roomId },
			relations: ['player1', 'player2'],
		});

		isRanked = game.is_ranked;
		game.is_finished = true;

		if (game.player1.user_id === this.p1.id) {
			game.player1_score = this.p1.score;
			game.player2_score = this.p2.score;
		} else if (game.player2.user_id === this.p1.id) {
			game.player1_score = this.p2.score;
			game.player2_score = this.p1.score;
		}

		if (p1Won) {
			game.winner_id = this.p1.id;
		} else {
			game.winner_id = this.p2.id;
		}

		await Game.gameRepository.save(game);

		const p1 = await Game.userRepository.findOne(this.p1.id);
		p1.user_status = UserStatus.ONLINE;
		if (isRanked) p1.score += this.p1.score;
		await Game.userRepository.save(p1);

		const p2 = await Game.userRepository.findOne(this.p2.id);
		p2.user_status = UserStatus.ONLINE;
		if (isRanked) p2.score += this.p2.score;
		await Game.userRepository.save(p2);

		await this.recalculateLadderLvl();

		io.to(this.roomId).emit('gameOver', {
			p1Score: this.p1.score,
			p2Score: this.p2.score
		});

		return Game.gameRepository.findOne(game.game_id);
	}

	gameOver(winner: number): void {
		this.restartScores();
		this.restartGame(winner);
		this.isGameOver = true;
	}

	restartScores(): void {
		this.p1.score = 0;
		this.p2.score = 0;
	}

	kickOff(): void {
		const randomPlayer = Math.floor(Math.random() * 2 + 1);

		this.isGameOver = false;
		this.restartGame(randomPlayer);
	}

	restartGame(startingPlayer: number): void {
		delete this.ball;
		this.ball = new Ball(this.conf);

		if (startingPlayer === 2) this.ball.velocity.x *= -1;
	}

	async recalculateLadderLvl() {
		const users = await Game.userRepository.find();

		users.sort((a, b) => b.score - a.score);

		for (let i = 0; i < users.length; i++) {
			users[i].ladder_lvl = i + 1;
			await Game.userRepository.save(users[i]);
		}
	}
}
