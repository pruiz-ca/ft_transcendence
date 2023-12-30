import { UserEntity } from 'src/user/entities/user.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('games')
export class GameEntity {
	@PrimaryGeneratedColumn('uuid')
		game_id?: string;

	@Column({ default: false })
		is_ranked: boolean;

	@Column({ default: 0 })
		player1_score: number;

	@Column({ default: 0 })
		player2_score: number;

	@ManyToOne(() => UserEntity, (userEntity) => userEntity.matches, {
		onDelete: 'CASCADE',
		nullable: true,
	})
	player1?: UserEntity; //could be just id?

	@ManyToOne(() => UserEntity, (userEntity) => userEntity.matches, {
		onDelete: 'CASCADE',
		nullable: true,
	})
	player2?: UserEntity; //could be just id?

	@Column({ default: 0 })
		winner_id: string;

	@Column({ default: false })
		is_finished: boolean;

	//date created
	@CreateDateColumn()
	created_at?: Date;

	//date finished
	@UpdateDateColumn()
	updated_at?: Date;
}
