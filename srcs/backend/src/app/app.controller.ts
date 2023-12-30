import {
	Controller,
	Get,
	OnModuleInit,
	Param,
	Post,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity, UserStatus } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

import { AppService } from './app.service';

@Controller()
export class AppController implements OnModuleInit {
	constructor(
		private readonly appService: AppService,
		@InjectRepository(UserEntity)
		private userRepository: Repository<UserEntity>,
	) {}

	/*
	 ** Sets all users as offline when the server starts
	 */
	onModuleInit() {
		this.userRepository.find().then((users) => {
			users.forEach(async (user) => {
				user.user_status = UserStatus.OFFLINE;
				await this.userRepository.save(user);
			});
		});
	}

	@Get()
	base() {}

	@Post('upload')
	@UseGuards(AuthGuard('jwt-twofa'))
	@UseInterceptors(FileInterceptor('file'))
	uploadImage(@UploadedFile() file) {
		this.appService.uploadImage(file);
	}

	@Get('/assets/:name')
	@UseGuards(AuthGuard('jwt-twofa'))
	getImage(@Param('name') name, @Res() res) {
		res.sendFile(name, { root: 'assets' });
	}
}
