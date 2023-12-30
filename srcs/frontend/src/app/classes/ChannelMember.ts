import { Channel, IChannel } from "./Channel";
import { User, UserRole, UserStatus } from "./User";

export enum SubType {
	DEFAULT,
    OWNER,
	ADMIN,
	BAN
}

export interface IChannelMember {
	user_id: string;
	username: string;
	avatar: string;
	score: number;
	victories: number;
	losses: number;
	ladder_lvl: number;
	two_fa: boolean;
	user_status: UserStatus;
	user_role: UserRole;
	channels:  IChannel[];

	subtype: SubType;
}

export class ChannelMember extends User {
    subtype: SubType;

    constructor(data: IChannelMember) {
		super(data);
		this.subtype = data.subtype; 
	}

	channelOp(channel: Channel) {
		channel.op(this.user_id);
	}

	channelUnOp(channel: Channel) {
		channel.default(this.user_id);
	}

	channelBan(channel: Channel) {
		channel.ban(this.user_id);
	}

	channelUnBan(channel: Channel) {
		channel.default(this.user_id);
	}

	channelKick(channel: Channel) {
		channel.kick(this.user_id);
	}
}