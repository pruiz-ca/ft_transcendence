import {
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Param,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isUUID } from 'class-validator';
import { UserService } from 'src/user/user.service';
import { GameService } from './game.service';

@Controller('games')
export class GameController {
	constructor(
		private readonly gameService: GameService,
		private readonly userService: UserService,
	) {}

	@Get()
	@UseGuards(AuthGuard('jwt-twofa'))
	async getAllGames() {
		return this.gameService.getAll();
	}

	@Get('/live')
	@UseGuards(AuthGuard('jwt-twofa'))
	async getAllLiveGames() {
		return this.gameService.getAllLiveGames();
	}

	@Get('/:id')
	@UseGuards(AuthGuard('jwt-twofa'))
	async getById(@Param('id') id) {
		const regexExp =
			/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

		const game = regexExp.test(id)
			? await this.gameService.getById(id)
			: undefined;

		if (!game) {
			throw new HttpException(
				{ status: HttpStatus.NOT_FOUND, error: 'game does not exist' },
				HttpStatus.NOT_FOUND,
			);
		}

		if (game.is_finished) {
			throw new HttpException(
				{
					status: HttpStatus.NOT_FOUND,
					error: 'game has already finished',
				},
				HttpStatus.NOT_FOUND,
			);
		}
		return game;
	}

	@Get('/user/:id')
	@UseGuards(AuthGuard('jwt-twofa'))
	async getUserGames(@Param('id') id) {
		if (!isUUID(id))
			throw new HttpException(
				{ status: HttpStatus.BAD_REQUEST, error: '8/invalid user id' },
				HttpStatus.BAD_REQUEST,
			);
		const user = await this.userService.findById(id);
		if (!user)
			throw new HttpException(
				{ status: HttpStatus.NOT_FOUND, error: 'user not found' },
				HttpStatus.NOT_FOUND,
			);
		return this.gameService.getUserGames(user);
	}
}
