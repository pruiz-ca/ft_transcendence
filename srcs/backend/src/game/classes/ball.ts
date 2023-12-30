import { Config } from './config';
import { Player } from './player';
import { Edges, Vector2D } from './utilities';
// import * as conf from './config';

export class Ball {
	constructor(
		public conf: Config,
		public velocity: Vector2D = new Vector2D(1, 0),
		public position: Vector2D = new Vector2D(0, 0),
		public radius: number = 0,
		public speed: number = 0,
		public edges: Edges = new Edges(),
	) {
		this.position.x = this.conf.screenWidth / 2;
		this.position.y = this.conf.screenHeight / 2;
		this.radius = this.conf.bRadius;
		this.speed = this.conf.bSpeed;
	}

	move(): void {
		this.position.x += this.velocity.x * this.speed;
		this.position.y += this.velocity.y * this.speed;
		this.updateEdges();
	}

	bounceWalls(): void {
		if (
			this.edges.top >= this.conf.screenHeight ||
			this.edges.bottom <= 0
		) {
			this.invertY();
		}
	}

	bouncePlayers(p1: Player, p2: Player): number {
		const hitsPlayer = this.getPlayerHit(p1, p2);

		if (hitsPlayer) {
			this.speed +=
				this.speed < this.conf.bSpeedMax ? this.conf.bSpeedIncr : 0;
			this.invertX();
			const hitAngle =
				hitsPlayer === 1
					? this.getHitAngle(p1, this.conf.bMaxAngle)
					: this.getHitAngle(p2, this.conf.bMaxAngle);
			this.velocity.y = this.speed * -Math.sin(hitAngle);
		}
		return hitsPlayer;
	}

	invertX(): void {
		this.velocity.x *= -1;
	}

	invertY(): void {
		this.velocity.y *= -1;
	}

	updateEdges(): void {
		this.edges.top = this.position.y + this.radius;
		this.edges.bottom = this.position.y - this.radius;
		this.edges.left = this.position.x - this.radius;
		this.edges.right = this.position.x + this.radius;
	}

	restart(startPos: Vector2D, initialSpeed: number): void {
		this.position.x = startPos.x;
		this.position.y = startPos.y;
		this.velocity.x = 1;
		this.velocity.y = 1;
		this.speed = initialSpeed;
	}

	/**
	 * Returns #player hit by the ball, 0 if none.
	 *
	 * Check collisions between ball and players.
	 * Shorten player height if mode 1 selected.
	 */
	getPlayerHit(player1: Player, player2: Player): number {
		const hitsPlayer1 =
			this.edges.left <= player1.edges.right &&
			this.edges.left >= player1.edges.left &&
			this.position.y >= player1.edges.top - this.radius &&
			this.position.y <= player1.edges.bottom + this.radius;
		const hitsPlayer2 =
			this.edges.right > player2.edges.left &&
			this.edges.right < player2.edges.right &&
			this.position.y > player2.edges.top - this.radius &&
			this.position.y < player2.edges.bottom + this.radius;

		if (this.velocity.x < 0 && hitsPlayer1) {
			// if (mode === 1 && player1.height - 10 > 42) {
			// 	player1.height -= 10;
			// 	player1.position.y += 5;
			// }
			return 1;
		}
		if (this.velocity.x > 0 && hitsPlayer2) {
			// if (mode === 1 && player2.height - 10 > 42) {
			// 	player2.height -= 10;
			// 	player2.position.y += 5;
			// }
			return 2;
		}
		return 0;
	}

	/**
	 * Returns exit angle after hitting a player.
	 *
	 * Checks where the ball hits the player in relation to its center.
	 * If it hits in the middle, the ball leaves with 0 angle.
	 * If it hits either edge, the ball leaves with maximum angle.
	 */
	getHitAngle(player: Player, maxBallAngle: number): number {
		const offset = player.getCenter() - this.position.y;
		const normalizedOffset = offset / player.height / 2;
		const angle = normalizedOffset * maxBallAngle;

		return angle;
	}
}
