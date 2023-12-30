import { BeforeInsert, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ChannelSubscriptionEntity } from "./channel_subscription.entity";
import { ChatMessageEntity } from "./message.entity";
import * as bcrypt from "bcryptjs"

const saltRounds = 10;

export enum ChannelType {
	DEFAULT,
	PRIVATE,
	GAME,
	PERSONAL
}

@Entity('channels')
export class ChannelEntity {
	
	@PrimaryGeneratedColumn('uuid')
	channel_id: string;
	
	@Column({ unique: true })
	name: string;
	
	@Column()
	avatar: string;

	@Column({ type: 'enum', enum: ChannelType, default: ChannelType.DEFAULT })
	type: ChannelType;

	@Column({ nullable: true, default: null })
	password: string;
	
	@OneToMany(() => ChannelSubscriptionEntity, channelSubscription => channelSubscription.channel)
	users: ChannelSubscriptionEntity[];	

	@OneToMany(() => ChatMessageEntity, message => message.channel)
	messages: ChatMessageEntity[];

	@BeforeInsert()
	async hashPassword() {
		if (!this.password)
			return;
		this.password = await bcrypt.hash(this.password, saltRounds);
	}
}