import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';
import { UserEntity } from 'src/user/entities/user.entity';


@Injectable()
export class JwtTwoFaStrategy extends PassportStrategy(Strategy, 'jwt-twofa') {
	constructor(private readonly userService: UserService) {
		super({
			jwtFromRequest: (req) => {
				if (!req || !req.cookies) return null;
				return req.cookies['access_token'];
			},
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET
		});
	}

	async validate(payload, done: Function): Promise<UserEntity> {
		const user = await this.userService.findById(payload.id);
		if (!user) return null;
		if (user.is_banned)
			return null;
		if (!user.two_fa || payload.two_fa)
			return user;
	}
}