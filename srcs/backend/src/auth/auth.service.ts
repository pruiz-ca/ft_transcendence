import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { toDataURL } from 'qrcode';
import { authenticator } from 'otplib';

import { UserService } from '../user/user.service';
import { UserEntity, UserStatus } from 'src/user/entities/user.entity';
import { AppGateway } from 'src/app/app.gateway';

@Injectable()
export class AuthService {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private appGateway: AppGateway,
	) {}

	async generateToken(id: string, two_fa = false): Promise<any> {
		const payload = { id: id, two_fa: two_fa };
		return this.jwtService.sign(payload);
	}

	async login(ft_id: string, username: string, avatar: string) {
		let is_new = false;
		let user: UserEntity = await this.userService.findById(ft_id, {
			ft_id: true,
		});
		if (!user) {
			user = await this.userService.createNewUser({
				ft_id,
				username,
				avatar,
			});
			is_new = true;
		}
		if (user.is_banned) return { user: null };
		const jwt = await this.generateToken(user.user_id);
		user = await this.userService.storeJwtToken(user, jwt);
		user = await this.userService.updateUserStatus(user, UserStatus.ONLINE);
		this.appGateway.emit('add_user', { user: user });
		return { user: user, jwt: jwt, is_new };
	}

	async generateTwoFaSecret(user: UserEntity) {
		const secret = authenticator.generateSecret();
		const otpathUrl = authenticator.keyuri(
			user.username,
			process.env.TWO_FA_NAME,
			secret,
		);
		await this.userService.storeTwoFaSecret(user.username, secret);
		return { secret, otpathUrl };
	}

	async sendQR(otpathUrl: string) {
		return await toDataURL(otpathUrl);
	}

	isTwoFaCodeValid(code: string, user: UserEntity) {
		return authenticator.verify({
			token: code,
			secret: user.two_fa_secret,
		});
	}

	async toggleTwoFactorAuth(user: UserEntity, on: boolean) {
		return this.userService.toggleTwoFactorAuth(user, on);
	}
}
