import { Controller, Delete, Get, HttpException, HttpStatus, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { ChatService } from './chat.service';
import { ChannelType } from './entities/channel.entity';
import { SubType } from './entities/channel_subscription.entity';
import { Channel } from './models/Channel';
import { getChannelDto } from './models/channel.dto';

@Controller('channels')
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
		private readonly userService: UserService
	) {}

	@Get()
	@UseGuards(AuthGuard('jwt-twofa'))
	async getChannels(@Req() req): Promise<getChannelDto[]> {
		let channels: Channel[] = await this.chatService.getChannels();
		const user = await this.userService.findById(req.user.user_id);
		if (user.user_role == UserRole.REGULAR)
			channels = channels.filter(channel => channel.type == ChannelType.DEFAULT);
		return channels.map(channel => channel.toDto());
	}

	@Get('/:id')
	@UseGuards(AuthGuard('jwt-twofa'))
	async getChannel(@Param('id') id, @Req() req): Promise<getChannelDto | null> {
		const channel = await this.chatService.getChannel(id, ['users', 'users.user', 'messages']);
		if (!channel)
			throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'channel not found' }, HttpStatus.NOT_FOUND);
		return channel.toDto();
	}

	@Delete('/:id')
	@UseGuards(AuthGuard('jwt-twofa'))
	async deleteChannel(@Param('id') id, @Req() req) {
		const channel = await this.chatService.getChannel(id, ['users', 'users.user']);
		if (!channel)
			throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'channel not found' }, HttpStatus.NOT_FOUND);
		const user = await this.userService.findById(req.user.user_id);
		if (
			user.user_role == UserRole.ADMIN
				|| user.user_role == UserRole.OWNER
				|| channel.users.find(sub => sub.user.user_id == req.user.user_id && (sub.type == SubType.ADMIN || sub.type == SubType.OWNER))
		)
			return await this.chatService.eraseChannel(channel.id);
		throw new HttpException({ status: HttpStatus.UNAUTHORIZED, error: 'you do not have the right permissions'}, HttpStatus.UNAUTHORIZED);
	}
}
