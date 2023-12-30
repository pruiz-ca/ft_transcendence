import { UserEntity } from 'src/user/entities/user.entity';
import { EntityRepository, Repository } from 'typeorm';
import { ChannelEntity } from '../entities/channel.entity';
import {
	ChannelSubscriptionEntity,
	SubType,
} from '../entities/channel_subscription.entity';

@EntityRepository(ChannelSubscriptionEntity)
export class ChannelSubscriptionRepository extends Repository<ChannelSubscriptionEntity> {
	async join(channel: ChannelEntity, user: UserEntity) {
		let sub = await this.findOne({ user: user, channel: channel });
		if (sub) throw 'could not subscribe the channel';
		sub = new ChannelSubscriptionEntity();
		sub.user = user;
		sub.channel = channel;
		sub.type = SubType.DEFAULT;

		return this.save(sub);
	}

	async leave(channel: ChannelEntity, user: UserEntity) {
		const sub = await this.findOne({ channel: channel, user: user });
		if (!sub) return;

		await this.delete(sub);
	}

	async setValue(channel: ChannelEntity, user: UserEntity, value: SubType) {
		const sub = await this.findOne({ user: user, channel: channel });
		if (!sub) return;

		sub.type = value;
		await this.save(sub);
	}
}
