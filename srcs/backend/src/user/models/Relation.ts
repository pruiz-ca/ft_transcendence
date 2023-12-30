import { RelationStatus } from "../entities/relation.entity";
import { IBaseUser } from "./User";
import { RelationType } from "../entities/relation.entity";

export interface IFriendRequestStatus {
    status: RelationStatus;
}

export interface IRelationRequest {
    relation_id?: string;
    sender: IBaseUser;
    receiver: IBaseUser;
    relation_type: RelationType;
    relation_status: RelationStatus;
}
