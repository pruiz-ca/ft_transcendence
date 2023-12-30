import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameEntity } from './match.entity';
import { GameGateway } from './game.gateway';
import { UserEntity } from 'src/user/entities/user.entity';
import { ChatModule } from 'src/chat/chat.module';
import { AppModule } from 'src/app/app.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([GameEntity]),
		TypeOrmModule.forFeature([UserEntity]),
		forwardRef(() => UserModule),
		forwardRef(() => ChatModule),
		forwardRef(() => AppModule)
	],
	controllers: [GameController],
	providers: [GameService, GameGateway],
	exports: [GameService],
})
export class GameModule {}
