import { Edges, Keys, Vector2D } from './utilities';
// import * as conf from './config';
import { Logger } from '@nestjs/common';
import { Config } from './config';

export class Player {
	public position: Vector2D;

	public edges: Edges;

	public log: Logger = new Logger('Player');

	constructor(
		public id: string,
		public conf: Config,
		public playerNo: number = 0,
		public name: string = 'user',
		public velocity: Vector2D = new Vector2D(0, 0),
		public height: number = 0,
		public width: number = 0,
		public score: number = 0,
		public keys: Keys = new Keys(),
	) {
		this.velocity.y = this.conf.pSpeed;
		this.height = this.conf.pHeight;
		this.width = this.conf.pWidth;

		if (this.playerNo === 1) {
			this.position = new Vector2D(
				10,
				this.conf.screenHeight / 2 - this.height / 2,
			);
		} else if (this.playerNo === 2) {
			this.position = new Vector2D(
				this.conf.screenWidth - this.width - 10,
				this.conf.screenHeight / 2 - this.height / 2,
			);
		}

		this.edges = new Edges(
			this.position.y,
			this.position.y + this.height,
			this.position.x,
			this.position.x + this.width,
		);
	}

	move(): void {
		let newY = this.position.y;

		if (
			(this.keys.up && !this.conf.pInvertedControls) ||
			(this.keys.down && this.conf.pInvertedControls)
		) {
			newY -= this.velocity.y;
		} else if (
			(this.keys.down && !this.conf.pInvertedControls) ||
			(this.keys.up && this.conf.pInvertedControls)
		) {
			newY += this.velocity.y;
		} else {
			return;
		}

		if (newY >= 0 && newY + this.height <= this.conf.screenHeight) {
			this.position.y = newY;
			this.updateEdges();
		}
	}

	updateEdges(yPosition: number = this.position.y): void {
		this.edges.top = yPosition - 6;
		this.edges.bottom = yPosition + this.height + 6;
	}

	getCenter(): number {
		return this.position.y + this.height / 2;
	}

	getScoreStr(): string {
		return this.score.toString();
	}

	incrementScore(): void {
		this.score++;
	}
}
