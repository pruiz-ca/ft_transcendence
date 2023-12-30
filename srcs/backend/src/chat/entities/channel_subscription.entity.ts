import { UserEntity } from "src/user/entities/user.entity";
import { BeforeInsert, Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { ChannelEntity } from "./channel.entity";

export enum SubType {
	DEFAULT,
	OWNER,
	ADMIN,
	BAN
}

@Entity('channels_subscriptions')
export class ChannelSubscriptionEntity {
	
	@Unique(['user', 'channel'])

	@PrimaryGeneratedColumn('uuid')
	subscription_id: string;

	@Column({ type: 'enum', enum: SubType, default: SubType.DEFAULT })
	type: SubType;

	@ManyToOne(() => UserEntity, user => user.channels, { cascade: true, onDelete: 'CASCADE' })
	user: UserEntity;

	@ManyToOne(() => ChannelEntity, channel => channel.users, { cascade: true, onDelete: 'CASCADE' })
	channel: ChannelEntity;
}