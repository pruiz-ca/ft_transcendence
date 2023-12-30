import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChannelEntity } from './channel.entity';

@Entity('messages')
export class ChatMessageEntity {
	@PrimaryGeneratedColumn()
	message_id: number;

	@Column()
	channel_id: string;

	@Column()
	from_id: string;

	@Column()
	from_name: string;

	@Column({ type: 'text' })
	text: string;

	@ManyToOne(() => ChannelEntity, (channel) => channel.messages, {
		onDelete: 'CASCADE',
	})
	channel: ChannelEntity;
}
