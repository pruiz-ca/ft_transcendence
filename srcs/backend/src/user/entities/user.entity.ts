import { ChannelSubscriptionEntity } from "src/chat/entities/channel_subscription.entity";
import { GameEntity } from "src/game/match.entity";
import { Column, Entity, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate, OneToMany } from "typeorm";
import { RelationEntity } from "./relation.entity";

export enum UserStatus {
	ONLINE = 'online',
	OFFLINE = 'offline',
	PLAYING = 'playing',
}

export enum UserRole {
	OWNER = "owner",
	ADMIN = "admin",
	REGULAR = "regular"
}

export enum AdminAction {
	BAN = 'ban',
	UNBAN = 'unban',
	ADMIN = 'admin',
	UNADMIN = 'unadmin'
}

@Entity('users')
export class UserEntity {
	@PrimaryGeneratedColumn('uuid')
		user_id?: string;

	@Column({ unique: true })
		ft_id?: string;

	@Column({ unique: true })
		username: string;

	@Column()
	avatar: string;
	
	@Column({ default: false })
	is_banned: boolean;

	@Column({ default: 0 })
		score: number;

	@Column({ default: 0 })
		victories: number;

	@Column({ default: 0 })
		losses: number;

	@Column({ default: 0 })
		ladder_lvl: number;

	@Column({ default: false })
	two_fa: boolean;

	@Column({
		type: 'enum',
		enum: UserStatus,
		default: UserStatus.OFFLINE,
	})
		user_status: UserStatus;

	@Column({
		type: "enum",
		enum: UserRole,
		default: UserRole.REGULAR
	})
	user_role: UserRole;

	@Column({ nullable: true })
		token: string;

	@Column({ nullable: true })
		two_fa_secret?: string;

	@OneToMany(
		() => ChannelSubscriptionEntity,
		(channelSubscription) => channelSubscription.user,
	)
		channels: ChannelSubscriptionEntity[];

	@OneToMany(() => RelationEntity, (relationEntity) => relationEntity.sender)
		sent_relations: RelationEntity[];

	@OneToMany(
		() => RelationEntity,
		(relationEntity) => relationEntity.receiver,
	)
		received_relations: RelationEntity[];

	@OneToMany(
		() => GameEntity,
		(GameEntity) => {
			if (!GameEntity.player1) return GameEntity.player1;
			return GameEntity.player2;
		},
	)
		matches: GameEntity[];
}
