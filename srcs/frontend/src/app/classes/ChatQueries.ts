import { ChannelType } from "./Channel";

enum cmd {
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

interface IChatQuery {
    cmd: cmd;

    target: string;

    args?: any[];

}

export class MessageRequest implements IChatQuery {
    cmd = cmd.MSG;

    target: string;

    args: any[] = [];

    constructor(target: string, message: string) {
        this.target = target;
        this.args[0] = message;
    }
}

export class JoinRequest implements IChatQuery {
    cmd = cmd.JOIN;

    target: string;

    args?: any[];

    constructor(target: string, password: string = '', type: ChannelType = ChannelType.DEFAULT) {
        this.target = target;
        this.args = [password, type];
    }
}

export class PartRequest implements IChatQuery {
    cmd = cmd.PART;

    target: string;

    args?: any[];

    constructor(target: string) {
        this.target = target;
    }
}

export class ModeRequest implements IChatQuery {
    cmd = cmd.MODE;

    target: string;

    args?: any[];

    constructor(target: string, args?: string[]) {
        this.target = target;
        this.args = args;
    }
}

export type chatQuery = MessageRequest | JoinRequest | PartRequest | ModeRequest;