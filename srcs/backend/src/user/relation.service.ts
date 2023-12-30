import {
	forwardRef,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';
import { IRelationRequest } from './models/Relation';
import {
	RelationEntity,
	RelationStatus,
	RelationType,
} from './entities/relation.entity';

@Injectable()
export class RelationService {
	constructor(
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService,
		@InjectRepository(RelationEntity)
		private relationRepository: Repository<RelationEntity>,
	) { }

	async getRequest(id: string) {
		return this.relationRepository.findOne({
			where: { relation_id: id },
			relations: ['sender', 'receiver'],
		});
	}

	async mutualRelationExists(
		sender: UserEntity,
		receiver: UserEntity,
		type: RelationType,
	) {
		const relation = await this.relationRepository.findOne({
			where: [
				{ sender, receiver, relation_type: type },
				{ sender: receiver, receiver: sender, relation_type: type },
			],
		});
		if (!relation || !relation.receiver || !relation.sender) return false;
		return true;
	}

	async singleRelationExists(
		sender: UserEntity,
		receiver: UserEntity,
		type: RelationType,
	) {
		const relation = await this.relationRepository.findOne({
			where: [{ sender, receiver, relation_type: type }],
		});
		if (!relation) return false;
		return true;
	}

	async sendRequest(
		receiverId: string,
		sender: UserEntity,
		type: RelationType,
	): Promise<IRelationRequest & RelationEntity> {
		if (receiverId == sender.user_id)
			throw "you cannot befriend yourself";
		const receiver = await this.userService.findById(receiverId);
		if (await this.singleRelationExists(sender, receiver, RelationType.BLOCK))
			throw "this user is blocked by you";
		if (await this.singleRelationExists(receiver, sender, RelationType.BLOCK))
			throw "u blocked";
		let exists = await this.mutualRelationExists(sender, receiver, type);
		if ((exists && type == RelationType.FRIEND))
			throw "duplicate relation request";
		if (exists && type == RelationType.GAME)
			throw "u already sent this... chill";
		const request: IRelationRequest = {
			sender,
			receiver,
			relation_type: type,
			relation_status: RelationStatus.PENDING,
		};
		return this.relationRepository.save(request);
	}

	async respondRequest(
		requestId: string,
		status: RelationStatus,
	): Promise<RelationEntity> {
		const request = await this.getRequest(requestId);
		if (!request) return;
		request.relation_status = status;
		await this.relationRepository.save(request);
		if (status == RelationStatus.DECLINED)
			return this.removeRequest(
				request.receiver,
				request.sender,
				request.relation_type,
			);
		return request;
	}

	async getUserFriends(user: UserEntity) {
		const userIds = [];
		const friendReq = await this.relationRepository.find({
			where: [
				{
					sender: user,
					relation_status: RelationStatus.ACCEPTED,
					relation_type: RelationType.FRIEND,
				},
				{
					receiver: user,
					relation_status: RelationStatus.ACCEPTED,
					relation_type: RelationType.FRIEND,
				},
			],
			relations: ['sender', 'receiver'],
		});
		friendReq.forEach((req) => {
			if (req.sender.user_id == user.user_id)
				userIds.push(req.receiver.user_id);
			else if (req.receiver.user_id == user.user_id)
				userIds.push(req.sender.user_id);
		});
		return this.userService.getAllById(userIds);
	}

	async getRequestStatus(user_id: string, sender: UserEntity, relation_type: RelationType) {
		const receiver = await this.userService.findById(user_id);
		const request = await this.relationRepository.findOne({
			where: [
				{
					sender: sender,
					receiver: receiver,
					relation_type: relation_type,
				},
				{
					sender: receiver,
					receiver: sender,
					relation_type: relation_type,
				},
			],
			relations: ['sender', 'receiver'],
		});
		if (
			request?.receiver.user_id === sender.user_id &&
			request?.relation_status == RelationStatus.PENDING
		)
			return { status: RelationStatus.USER_RESPONSE };
		return { status: request?.relation_status || RelationStatus.NOT_SENT };
	}

	async removeRequest(
		receiver: UserEntity,
		sender: UserEntity,
		type: RelationType,
	): Promise<RelationEntity> {
		const request = await this.relationRepository.findOne({
			where: [
				{ sender: sender, receiver: receiver, relation_type: type },
				{ sender: receiver, receiver: sender, relation_type: type },
			],
			relations: ['sender', 'receiver'],
		});
		if (!request) return;
		await this.relationRepository.delete(request);
		return request;
	}

	async getRequests(user: UserEntity) {
		return this.relationRepository.find({
			where: [
				{
					receiver: user,
					relation_status: RelationStatus.PENDING,
					relation_type: RelationType.FRIEND,
				},
				{
					receiver: user,
					relation_status: RelationStatus.PENDING,
					relation_type: RelationType.GAME,
				},
			],
			relations: ['sender'],
		});
	}

	async blockUser(receiver: UserEntity, sender: UserEntity) {
		const exists = await this.singleRelationExists(
			sender,
			receiver,
			RelationType.BLOCK,
		);
		if (exists) return;
		if (
			await this.mutualRelationExists(
				sender,
				receiver,
				RelationType.FRIEND,
			)
		)
			await this.removeRequest(receiver, sender, RelationType.FRIEND);

		const request: IRelationRequest = {
			sender,
			receiver: receiver,
			relation_type: RelationType.BLOCK,
			relation_status: RelationStatus.BLOCKED,
		};
		return this.relationRepository.save(request);
	}

	async getUserBlocked(user: UserEntity) {
		let userIds = [];
		let blocks = await this.relationRepository.find({
			where: [
				{
					sender: user,
					relation_status: RelationStatus.BLOCKED,
					relation_type: RelationType.BLOCK,
				},
			],
			relations: ['sender', 'receiver'],
		});
		blocks.forEach((req) => {
			userIds.push(req.receiver.user_id);
		});
		return this.userService.getAllById(userIds);
	}

	async unblockUser(receiver: UserEntity, sender: UserEntity) {
		const request = await this.relationRepository.findOne({
			where: [
				{
					sender: sender,
					receiver: receiver,
					relation_type: RelationType.BLOCK,
				},
			],
			relations: ['sender', 'receiver'],
		});
		return this.relationRepository.delete(request);
	}
}
