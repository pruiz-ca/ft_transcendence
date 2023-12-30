import { SubType } from "src/chat/entities/channel_subscription.entity";
import { Channel } from "src/chat/models/Channel";
import { RelationType } from "../entities/relation.entity";
import { UserEntity, UserRole, UserStatus } from "../entities/user.entity";
import { getUserDto } from "./user.dto";

export interface IBaseUser {
	ft_id?: string;
	username: string;
	is_banned: boolean;
	avatar: string;
	score: number;
	victories: number;
	losses: number;
	ladder_lvl: number;
	two_fa: boolean;
	user_status: UserStatus;
	user_role: UserRole;
	token?: string;
}

export interface IUpdateUserInfo {
	username: string;
	avatar: string;
}

export interface TwoFaCode {
	code: string;
}

export interface INotification {
	action: 'send' | 'accept' | 'decline' | 'remove';
	type: 'friend' | 'challenge';
	receiver?: string;
	request_id?: string;
}

export interface TmpUser {
	id: string;
	username: string;
}

export function entityToDTO(rawUser: UserEntity): getUserDto {
	if (!rawUser)
		return null;
	let user: getUserDto = {
		user_id: rawUser.user_id,
		username: rawUser.username,
		avatar: rawUser.avatar,
		score: rawUser.score,
		victories: rawUser.victories,
		losses: rawUser.losses,
		ladder_lvl: rawUser.ladder_lvl,
		two_fa: rawUser.two_fa,
		user_status: rawUser.user_status,
		user_role: rawUser.user_role,
		channels: rawUser.channels?.filter(sub => sub.type != SubType.BAN).map(sub => new Channel(sub.channel).toDto()),
		blockIds: rawUser.received_relations?.filter(rel => rel.relation_type == RelationType.BLOCK).map(rel => rel.receiver.user_id)
	};
	return user;
};