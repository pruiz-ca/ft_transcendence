export enum Cmd {
	MSG,
	JOIN,
	PART,
	MODE
}

export enum Modes {
	ADMIN = 'o',
	BAN = 'b',
	DEFAULT = 'd',
	PASSWORD = 'p',
	PRIVATE = 'l',
	KICK = 'k'
}



export interface IChatQuery {
	cmd: Cmd;

	target: string;

	user: string;

	args: string[];

}