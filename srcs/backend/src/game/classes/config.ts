// /*
//  ** Game Config
//  */
// export const screenWidth = 640; //px
// export const screenHeight = 480; //px
// export const maxScore = 10;
// export const kickOffTime = 3; // secs

// /*
//  ** Player Config
//  */
// export const pSpeed = 5;
// export const pHeight = 86; //px
// export const pWidth = 20; //px

// /*
//  ** Ball Config
//  */
// export const bSpeed = 4;
// export const bSpeedMax = 7;
// export const bSpeedIncr = 0.5;
// export const bRadius = 10; //px
// export const bMaxAngle = (45 * Math.PI) / 180; // rad

export class Config {
	constructor(
		public screenWidth = 640, //px
		public screenHeight = 480, //px
		public maxScore = 10,
		public kickOffTime = 2, // secs

		/*
		 ** Player Config
		 */
		public pSpeed = 5,
		public pHeight = 86, //px
		public pWidth = 20, //px
		public pInvertedControls = false, //px

		/*
		 ** Ball Config
		 */
		public bSpeed = 4,
		public bSpeedMax = 7,
		public bSpeedIncr = 0.5,
		public bRadius = 10, //px
		public bMaxAngle = (45 * Math.PI) / 180, // rad
	) {}

	doubleSpeed() {
		this.bSpeed *= 2;
		this.bSpeedMax *= 2;
		this.bSpeedIncr *= 1.1;
		this.pSpeed *= 2;
	}

	halvePlayers() {
		this.pHeight /= 2;
	}

	invertControls() {
		this.pInvertedControls = true;
	}
}
