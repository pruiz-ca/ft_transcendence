import * as conf from './config';

export class Vector2D {
	constructor(public x: number, public y: number) {}
}

export class Keys {
	constructor(public up: boolean = false, public down: boolean = false) {}
}

export class Colors {
	constructor(
		public bg: string = conf.colorBackground,
		public p1: string = conf.colorPlayer1,
		public p2: string = conf.colorPlayer2,
		public ball: string = conf.colorBall,
		public score: string = conf.colorScore,
		public net: string = conf.colorNet,
	) {}
}
