import {Vector2D} from './utilities';

export class Player {
	public id!: string;

	constructor(
		public pos: Vector2D,
		public h: number,
		public w: number,
		public soundfile: string,
		public score: number = 0,
		public upKeyPressed: boolean = false,
		public downKeyPressed: boolean = false,
		public sound: HTMLAudioElement = new Audio(),
	) {
		this.sound.src = soundfile;
		this.sound.load();
	}
}
