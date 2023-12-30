import { forwardRef, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { AppGateway } from './app.gateway';
import { ChatModule } from 'src/chat/chat.module';
import { GameModule } from '../game/game.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		AuthModule,
		forwardRef(() => UserModule),
		forwardRef(() => ChatModule),
		forwardRef(() => GameModule),
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST,
			port: parseInt(process.env.DB_PORT),
			username: process.env.DB_USER,
			database: process.env.DB_NAME,
			password: process.env.DB_PASSWD,
			entities: [__dirname + '/../**/*.entity.js'],
			synchronize: true,
		}),
	],
	controllers: [AppController],
	providers: [AppService, AppGateway],
	exports: [AppGateway],
})
export class AppModule {}
