import {IUser} from './User';

export interface IGame {
	game_id: string;
	player1_score: number;
	player2_score: number;
	player1: IUser;
	player2: IUser;
	winner_id: string;
	is_finished: boolean;
}
