import { UserRole, UserStatus } from "src/user/entities/user.entity";
import { ChannelType } from "../entities/channel.entity";
import { SubType } from "../entities/channel_subscription.entity";

export interface getChannelMemberDto {
	user_id: string;
	username: string;
	avatar: string;
	score: number;
	victories: number;
	losses: number;
	ladder_lvl: number;
	two_fa: boolean;
	user_status: UserStatus;
	// user_role: UserRole;
	subtype: SubType;
}

export interface getChannelDto {
	id: string;

	name: string;

	avatar: string;

	type: ChannelType;

	hasPassword: boolean;

	users: getChannelMemberDto[];

	messages: { fromId: string, fromUsername: string, text: string }[]
}