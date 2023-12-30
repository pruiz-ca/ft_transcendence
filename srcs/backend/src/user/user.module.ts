import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from './entities/user.entity';
import { RelationEntity } from './entities/relation.entity';
import { RelationService } from './relation.service';
import { GameModule } from 'src/game/game.module';
import { AppModule } from 'src/app/app.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, RelationEntity]),
		forwardRef(() => GameModule),
		forwardRef(() => AppModule),
		forwardRef(() => ChatModule),
		HttpModule,
	],
	controllers: [UserController],
	providers: [UserService, RelationService],
	exports: [UserService, RelationService],
})
export class UserModule {}
