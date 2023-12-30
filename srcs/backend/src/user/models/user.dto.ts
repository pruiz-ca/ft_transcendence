import { getChannelDto } from "src/chat/models/channel.dto";
import { UserRole, UserStatus } from "../entities/user.entity";

export interface getUserDto {
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
	channels?:  getChannelDto[];
	blockIds?: string[];
}