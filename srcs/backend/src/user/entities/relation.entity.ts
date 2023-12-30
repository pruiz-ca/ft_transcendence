import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";

export enum RelationType {
    FRIEND = "friend",
    BLOCK = "block",
	GAME = "challenge"
}

export enum RelationStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    DECLINED = "declined",
    NOT_SENT = "not_sent",
    USER_RESPONSE = "awaiting_response",
    BLOCKED = "blocked"
}

@Entity('relations')
export class RelationEntity {
    
    @PrimaryGeneratedColumn("uuid")
    relation_id?: string;

    @ManyToOne(() => UserEntity, userEntity => userEntity.sent_relations, { eager: true, onDelete: "CASCADE" })
    sender: UserEntity;

    @ManyToOne(() => UserEntity, userEntity => userEntity.received_relations, { eager: true, onDelete: "CASCADE" })
    receiver: UserEntity | null;

    @Column({ type: "enum", enum: RelationStatus, default: RelationStatus.NOT_SENT })
    relation_status: RelationStatus;

    @Column({ type: "enum", enum: RelationType })
    relation_type: RelationType;

}