/* eslint-disable import/no-unresolved */
import {Ball} from './ball';
import {Player} from './player';
import {Vector2D} from './utilities';
import * as conf from './config';

export class Game {
	public ball: Ball;
	public player1: Player;
	public player2: Player;

	constructor(
		public playerWidth = conf.pWidth,
		public playerHeight = conf.pHeight,
		public isGameOver = false,
	) {
		this.ball = new Ball(new Vector2D(0, 0), 10);

		this.player1 = new Player(
			new Vector2D(0, 0),
			this.playerHeight,
			this.playerWidth,
			conf.p1SoundFile,
		);

		this.player2 = new Player(
			new Vector2D(0, 0),
			this.playerHeight,
			this.playerWidth,
			conf.p2SoundFile,
		);
	}

	setPlayerIds(p1_id: string, p2_id: string) {
		this.player1.id = p1_id;
		this.player2.id = p2_id;
	}
}
