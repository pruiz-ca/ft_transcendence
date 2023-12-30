import { UserService } from "app/services/user.service";
import { IChannel } from "./Channel";

export enum UserStatus {
	ONLINE = "online",
	OFFLINE = "offline",
	PLAYING = "playing"
}

export enum UserRole {
	OWNER = "owner",
	ADMIN = "admin",
	REGULAR = "regular"
}

export interface IUser {
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
	blockIds?: string[];
}

export interface IUpdateUserInfo {
	username: string;
	avatar: string;
}

export enum RelationType {
	FRIEND = "friend",
	BLOCK = "block",
	GAME = "challenge"
}

export enum RelationStatus {
	PENDING = "pending",
	ACCEPTED = "accepted",
	DECLINED = "declined",
	NOT_SENT = "not_sent",
	USER_RESPONSE = "awaiting_response",
}

export interface IFriendRequestStatus {
	status: RelationStatus;
}

export interface IRelationRequest {
	relation_id: string;
	sender: IUser;
	receiver: IUser;
	relation_type: RelationType;
	relation_status: RelationStatus;
}

export interface TwoFaCode {
	code: string;
}

export enum AdminAction {
	BAN = 'ban',
	UNBAN = 'unban',
	ADMIN = 'admin',
	UNADMIN = 'unadmin'
}

export class User implements IUser {
	static userService: UserService;

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
	blockIds?: string[];

	constructor(data: IUser) {
		this.user_id = data.user_id;
		this.username = data.username;
		this.avatar = data.avatar;
		this.score = data.score;
		this.victories = data.victories;
		this.losses = data.losses;
		this.ladder_lvl = data.ladder_lvl;
		this.user_role = data.user_role;
		this.two_fa = data.two_fa;
		this.user_status = data.user_status;
		this.channels = data.channels;

		this.blockIds = data.blockIds;
	}

	goToProfile() {
		User.userService.goToProfile(this);
	}

	challenge() {
		User.userService.challengeUser(this.user_id);
	}

	chat() {
		User.userService.openUserChat(this.user_id);
	}

	hasAdminPermissions() {
		if (this.user_role == UserRole.REGULAR) return false;
		return true;
	}

	getRole() {
		return this.user_role;
	}
}