import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { entityToDTO, IUpdateUserInfo } from './models/User';
import { AdminAction, UserEntity, UserRole } from './entities/user.entity';
import { RelationService } from './relation.service';
import { getUserDto } from './models/user.dto';
import { RelationType } from './entities/relation.entity';
import { isUUID } from 'class-validator';

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService, private relationService: RelationService) {}

	@Get()
	@UseGuards(AuthGuard('jwt-twofa'))
	async getAllUsers(): Promise<getUserDto[]> {
		let rawUsers: UserEntity[] = await this.userService.getAll();

		let users: getUserDto[] = [];
		rawUsers.forEach(res => {
			users.push(entityToDTO(res));
		});
		return users;
	}

	@Get('/me')
	@UseGuards(AuthGuard('jwt-twofa'))
	async getUserFromToken(@Req() req): Promise<getUserDto> {
		let rawUser = await this.userService.findById(req.user.user_id, { channels: true, blocks: true });
		const user = entityToDTO(rawUser);
		user.channels = await this.userService.clearChannels(rawUser);
		user.blockIds = await this.userService.getUserBlocks(rawUser);
		return user;
	}
	
	@Get('/:id')
	@UseGuards(AuthGuard('jwt-twofa'))
	async getUser(@Param('id') id): Promise<getUserDto> {
		if (!isUUID(id)) throw new HttpException({ status: HttpStatus.BAD_REQUEST, error: '1/wrong user id' }, HttpStatus.BAD_REQUEST);
		let user = await this.userService.findById(id);
        if (!user) throw new HttpException({ status: HttpStatus.NOT_FOUND, error: '1/user not found' }, HttpStatus.NOT_FOUND);
		return entityToDTO(user);
	}
	
	@Patch()
	@UseGuards(AuthGuard('jwt-twofa'))
	async editUserProfile(@Req() req, @Body() newInfo: IUpdateUserInfo) {
		let user = await this.userService.findByUsername(newInfo.username);
		if (user && req.user.user_id != user.user_id)
			throw new HttpException({ status: HttpStatus.CONFLICT, error: 'username ' + newInfo.username + ' is taken' }, HttpStatus.CONFLICT);
		return await this.userService.updateUserProfile(req.user, newInfo);
	}

	@Delete('/:id')
	@UseGuards(AuthGuard('jwt-twofa'))
	async deleteUserAccount(@Param('id') id) {
		if (!isUUID(id)) throw new HttpException({ status: HttpStatus.BAD_REQUEST, error: '2/wrong user id' }, HttpStatus.BAD_REQUEST);
		let user = await this.userService.findById(id);
        if (!user) throw new HttpException({ status: HttpStatus.NOT_FOUND, error: '2/user not found' }, HttpStatus.NOT_FOUND);
		return await this.userService.deleteUserAccount(user.user_id);
	}

    @Get('relation/friend/:id')
    @UseGuards(AuthGuard('jwt-twofa'))
    async getRequestStatus(@Param('id') id, @Req() req) {
		if (!isUUID(id)) throw new HttpException({ status: HttpStatus.BAD_REQUEST, error: '3/wrong user id' }, HttpStatus.BAD_REQUEST);
		let user = await this.userService.findById(id);
        if (!user) throw new HttpException({ status: HttpStatus.NOT_FOUND, error: '3/user not found' }, HttpStatus.NOT_FOUND);
        return await this.relationService.getRequestStatus(user.user_id, req.user, RelationType.FRIEND);
    }
	
	@Get('relation/friends/:id')
    @UseGuards(AuthGuard('jwt-twofa'))
    async getUserFriends(@Param('id') id) {
		if (!isUUID(id)) throw new HttpException({ status: HttpStatus.BAD_REQUEST, error: '4/wrong user id' }, HttpStatus.BAD_REQUEST);
		let user = await this.userService.findById(id);
        if (!user) throw new HttpException({ status: HttpStatus.NOT_FOUND, error: '4/user not found' }, HttpStatus.NOT_FOUND);
        return await this.relationService.getUserFriends(user);
    }

	@Delete('relation/friend/:id')
    @UseGuards(AuthGuard('jwt-twofa'))
    async removeRequest(@Param('id') id, @Req() req) {
		if (!isUUID(id)) throw new HttpException({ status: HttpStatus.BAD_REQUEST, error: '5/wrong user id' }, HttpStatus.BAD_REQUEST);
		let user = await this.userService.findById(id);
        if (!user) throw new HttpException({ status: HttpStatus.NOT_FOUND, error: '5/user not found' }, HttpStatus.NOT_FOUND);
        return await this.relationService.removeRequest(id, req.user, RelationType.FRIEND);
    }

    @Get('relation/requests')
    @UseGuards(AuthGuard('jwt-twofa'))
    async getRequests(@Req() req) {
        return await this.relationService.getRequests(req.user);
    }
    
	/*
	** BLOCKS
	*/
    @Post('relation/block/:id')
    @UseGuards(AuthGuard('jwt-twofa'))
    async blockUser(@Param('id') id, @Req() req) {
		if (!isUUID(id)) throw new HttpException({ status: HttpStatus.BAD_REQUEST, error: '6/wrong user id' }, HttpStatus.BAD_REQUEST);
		let user = await this.userService.findById(id);
        if (!user) throw new HttpException({ status: HttpStatus.NOT_FOUND, error: '6/user not found' }, HttpStatus.NOT_FOUND);
		if (req.user.user_id == user.user_id) throw new HttpException({ status: HttpStatus.BAD_REQUEST, error: 'you cannot befriend yourself' }, HttpStatus.BAD_REQUEST);
        return await this.relationService.blockUser(user, req.user);
    }

    @Get('relation/blocks')
    @UseGuards(AuthGuard('jwt-twofa'))
    async getUserBlocked(@Req() req) {
        return await this.relationService.getUserBlocked(req.user);
    }

    @Delete('relation/block/:id')
    @UseGuards(AuthGuard('jwt-twofa'))
    async unblockUser(@Param('id') id, @Req() req) {
		if (!isUUID(id)) throw new HttpException({ status: HttpStatus.BAD_REQUEST, error: '7/wrong user id' }, HttpStatus.BAD_REQUEST);
		let user = await this.userService.findById(id);
        if (!user) throw new HttpException({ status: HttpStatus.NOT_FOUND, error: '7/user not found' }, HttpStatus.NOT_FOUND);
        return await this.relationService.unblockUser(user, req.user);
    }

	/*
	** CHALLENGE REQUEST
	*/
	@Get('relation/challenge/:id')
    @UseGuards(AuthGuard('jwt-twofa'))
    async getChallengeRequestStatus(@Param('id') id, @Req() req) {
		if (!isUUID(id)) throw new HttpException({ status: HttpStatus.BAD_REQUEST, error: '8/wrong user id' }, HttpStatus.BAD_REQUEST);
		let user = await this.userService.findById(id);
        if (!user) throw new HttpException({ status: HttpStatus.NOT_FOUND, error: '8/user not found' }, HttpStatus.NOT_FOUND);
        return await this.relationService.getRequestStatus(user.user_id, req.user, RelationType.GAME);
    }

	@Patch('/:id')
    @UseGuards(AuthGuard('jwt-twofa'))
	async exerciseAdminRights(@Param('id') id, @Req() req, @Body() action : { action: AdminAction }) {
		if (!isUUID(id)) throw new HttpException({ status: HttpStatus.BAD_REQUEST, error: '9/wrong user id' }, HttpStatus.BAD_REQUEST);
		let victim = await this.userService.findById(id);
        if (!victim) throw new HttpException({ status: HttpStatus.NOT_FOUND, error: '8/user not found' }, HttpStatus.NOT_FOUND);
		if (req.user.user_role != UserRole.ADMIN && req.user.user_role != UserRole.OWNER)
			throw new HttpException({ status: HttpStatus.FORBIDDEN, error: '8/ur not allowed...' }, HttpStatus.FORBIDDEN);
		return await this.userService.exerciseAdminRights(victim, action.action);
	}
}