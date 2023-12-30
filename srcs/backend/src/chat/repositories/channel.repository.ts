import { EntityRepository, Repository } from "typeorm";
import { ChannelEntity, ChannelType } from '../entities/channel.entity'
import { Channel } from "../models/Channel";
import * as bcrypt from "bcryptjs";


const saltRounds = 10;

@EntityRepository(ChannelEntity)
export class ChannelRepository extends Repository<ChannelEntity> {
	
	async createChannel(name: string, type: ChannelType = ChannelType.DEFAULT, password: string = null): Promise<ChannelEntity> {
		if (type != ChannelType.PERSONAL && type != ChannelType.GAME && !/[ˆa-zA-Z]+$/.test(name))
			throw 'invalid channel name'
		let channelEntity = await this.findOne({ name: name });
		if (channelEntity)
			return channelEntity;

		channelEntity = new ChannelEntity();
		channelEntity.name = name;
		channelEntity.avatar = process.env.API_URL + "/assets/default.jpeg";
		channelEntity.users = [];
		channelEntity.password = password;
		channelEntity.type = type;

		return await this.save(channelEntity);
	}

	async removeChannel(channel: ChannelEntity) {
		const channelEntity = await this.findOne({channel_id: channel.channel_id});
		if (!channel)
			return;

		await this.delete(channelEntity);		
	}

	async updateChannel(channel: Channel) {
		const channelEntity = channel.entity;
		channelEntity.name = channel.name;
		channelEntity.password = channel.password;
		channelEntity.type = channel.type;
		channelEntity.messages = channel.messages;
		channelEntity.users = channel.users;

		await this.save(channelEntity);
	}

	async changePassword(channelEntity: ChannelEntity, password: string): Promise<string | null> {
		channelEntity.password = await bcrypt.hash(password, saltRounds);
		await this.save(channelEntity);
		return channelEntity.password;
	}
}