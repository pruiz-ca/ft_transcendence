import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';
import { UserEntity } from 'src/user/entities/user.entity';

config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(private readonly userService: UserService) {
		super({
			jwtFromRequest: (req) => {
				if (!req || !req.cookies) return null;
				return req.cookies.access_token;
			},
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET,
		});
	}

	async validate(payload, done: Function): Promise<UserEntity> {
		const user = await this.userService.findById(payload.id);
		if (!user || user.is_banned) return null;
		return user;
	}
}
