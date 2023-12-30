import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from 'src/app/app.module';
import { UserModule } from 'src/user/user.module';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessageEntity } from './entities/message.entity';
import { ChannelRepository } from './repositories/channel.repository';
import { ChannelSubscriptionRepository } from './repositories/channel_subscription.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([ChatMessageEntity, ChannelRepository, ChannelSubscriptionRepository]),
		forwardRef(() => AppModule), forwardRef(() => UserModule)
	],
	controllers: [ChatController],
	providers: [ChatService],
	exports: [ChatService],
})
export class ChatModule {}
