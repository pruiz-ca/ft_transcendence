export class Vector2D {
	constructor(public x: number, public y: number) {}
}

export class Edges {
	constructor(
		public top: number = 0,
		public bottom: number = 0,
		public left: number = 0,
		public right: number = 0,
	) {}
}

export class Keys {
	constructor(public up: boolean = false, public down: boolean = false) {}
}

export class FpsControl {
	constructor(
		public fps: number = 60,
		public interval: number = 1000 / fps,
		public startTime: number = 0,
		public now: number = 0,
		public then: number = 0,
		public elapsed: number = 0,
		public newtime: number = 0,
		public frames: number = 0,
	) {}
}
