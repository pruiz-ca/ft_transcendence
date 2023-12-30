import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { config } from 'dotenv';
import { AppModule } from 'src/app/app.module';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FortyTwoStrategy } from './fortytwo.strategy';
import { JwtStrategy } from './jwt.strategy';
import { JwtTwoFaStrategy } from './twofa.strategy';

config();

@Module({
	imports: [
		UserModule,
		HttpModule,
		forwardRef(() => AppModule),
		JwtModule.register({
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: "1 days" },
		})
	],
	controllers: [AuthController],
	providers: [AuthService, FortyTwoStrategy, JwtStrategy, JwtTwoFaStrategy],
	exports: [AuthService],
})
export class AuthModule { }
