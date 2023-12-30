import {
	Body,
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Post,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { TmpUser, TwoFaCode } from 'src/user/models/User';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
	) {}

	@Get('42')
	@UseGuards(AuthGuard('42'))
	triggerLogin() {}


	@Get('42/callback')
	@UseGuards(AuthGuard('42'))
	async loginCallback(@Req() req, @Res() res: Response) {
		let url: string;
		const photoUrl = 'https://cdn.intra.42.fr/users/';
		let avatar = photoUrl.concat(req.user.username, '.jpg');
		if (!this.userService.urlExists(avatar)) {
			avatar = 'https://thispersondoesnotexist.com/image';
		}
		const tmp = await this.authService.login(
			req.user.id,
			req.user.username,
			avatar,
		);
		if (!tmp.user) return res.redirect(process.env.HOME_URL + '/login');
		if (tmp.is_new)
			url =
				process.env.HOME_URL +
				'/login?success=' +
				tmp.jwt +
				'&new=' +
				tmp.is_new;
		else url = process.env.HOME_URL + '/login?success=' + tmp.jwt;
		return res.redirect(url);
	}

	@Get('2fa')
	@UseGuards(AuthGuard('jwt-twofa'))
	async generateTwoFaCode(@Req() req) {
		const { otpathUrl } = await this.authService.generateTwoFaSecret(
			req.user,
		);
		return this.authService.sendQR(otpathUrl);
	}

	@Post('2fa/activate')
	@UseGuards(AuthGuard('jwt-twofa'))
	async activateTwoFa(
		@Req() req,
		@Body() code: TwoFaCode,
		@Res() res: Response,
	) {
		const isValid = this.authService.isTwoFaCodeValid(code.code, req.user);
		if (!isValid)
			throw new HttpException(
				{
					status: HttpStatus.BAD_REQUEST,
					error: 'two-fa code is invalid',
				},
				HttpStatus.BAD_REQUEST,
			);
		await this.authService.toggleTwoFactorAuth(req.user, true);
		const jwt = await this.authService.generateToken(
			req.user.user_id,
			true,
		);
		await this.userService.storeJwtToken(req.user, jwt);
		return res.status(200).json({ token: jwt });
	}

	@Post('2fa/authenticate')
	@UseGuards(AuthGuard('jwt'))
	async authenticateTwoFa(
		@Req() req,
		@Body() code: TwoFaCode,
		@Res() res: Response,
	) {
		const isValid = this.authService.isTwoFaCodeValid(code.code, req.user);
		if (!isValid)
			throw new HttpException(
				{
					status: HttpStatus.BAD_REQUEST,
					error: 'two-fa code is invalid',
				},
				HttpStatus.BAD_REQUEST,
			);
		const jwt = await this.authService.generateToken(
			req.user.user_id,
			true,
		);
		await this.userService.storeJwtToken(req.user, jwt);
		return res.status(200).json({ token: jwt });
	}

	@Post('2fa/deactivate')
	@UseGuards(AuthGuard('jwt-twofa'))
	async deactivateTwoFa(@Req() req, @Res() res: Response) {
		if (!req.user.two_fa) return;
		await this.authService.toggleTwoFactorAuth(req.user, false);
		await this.userService.storeTwoFaSecret(req.user.username, null);
		const jwt = await this.authService.generateToken(req.user.user_id);
		await this.userService.storeJwtToken(req.user, jwt);
		return res.status(200).json({ token: jwt });
	}
}
