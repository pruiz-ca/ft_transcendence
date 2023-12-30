import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {Socket} from 'socket.io-client';
import {Keys} from '../game/classes/utilities';
import {Game} from '../game/classes/game';
import * as conf from '../game/classes/config';
import {IGame} from '../classes/Game';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {PongService} from './pong.service';
import {Router} from '@angular/router';
import {UserService} from './user.service';

@Injectable({
	providedIn: 'root',
})
export class GameService {
	public socket: Socket;

	private readonly baseUrl = `${environment.apiUrl}games`;

	private _liveGame$ = new BehaviorSubject<IGame[]>([]);
	liveGame$ = this._liveGame$.asObservable();

	gameSelector$ = new BehaviorSubject<IGame | undefined>(undefined);

	get liveGames() {
		return this._liveGame$.value;
	}

	constructor(
		private pongService: PongService,
		private http: HttpClient,
		private router: Router,
	) {
		this.socket = pongService.socket;
		this.matchMaker();
	}

	public emitStartGame(payload: any) {
		if (payload.roomId) {
			this.socket.emit('startGame', payload);
		}
	}

	public emitCreateGame() {
		this.socket.emit('createGame');
	}

	public emitStopGame() {
		this.socket.emit('stopGame');
	}

	public emitKeyPress(keys: Keys) {
		this.socket.emit('keyPress', keys);
	}

	public updatePositions = (game: Game) => {
		this.socket.on('gameInfo', (payload: any) => {
			game.ball.pos.x =
				(payload.posBall.x * conf.scrWidth) / 640 - conf.scrWidth / 2;
			game.ball.pos.y =
				(payload.posBall.y * conf.scrHeight) / 480 - conf.scrHeight / 2;

			game.player1.pos.y =
				(payload.posP1.y * conf.scrHeight) / 480 -
				conf.scrHeight / 2 +
				game.playerHeight / 2;
			game.player2.pos.y =
				(payload.posP2.y * conf.scrHeight) / 480 -
				conf.scrHeight / 2 +
				game.playerHeight / 2;
		});
	};

	public updateScore = (game: Game) => {
		this.socket.on('score', (payload: any) => {
			game.player1.score = payload.scoreP1;
			game.player2.score = payload.scoreP2;
		});
	};

	public gameOver = (game: Game) => {
		this.socket.on('gameOver', (payload: any) => {
			game.isGameOver = true;
			this.router.navigate(['/']);
			if (!payload) return;
		});
	};

	public playPlayerSound = (game: Game) => {
		this.socket.on('playerHit', (payload) => {
			if (payload === 1) {
				game.player1.sound.play();
			} else if (payload === 2) {
				game.player2.sound.play();
			}
		});
	};

	public socketLog = () => {
		this.socket.on('log', (payload: any) => {
			console.log(payload);
		});
	};

	public matchMaker = () => {
		this.socket.on('matchmaking', (payload: any) => {
			if (payload.error) {
				return;
			}
			this.updateGames();
			this.openGame(payload.game);
			this.emitStartGame({
				roomId: payload.game.game_id,
				event: payload.event,
			});
		});
	};

	public getConfigFromServer = (game: Game) => {
		this.socket.on('gameConfig', (pHeight: any) => {
			game.playerHeight = pHeight;
		});
	};

	getAllGames() {
		return this.http.get<IGame[]>(this.baseUrl);
	}

	getGame(gameId: string) {
		return this.http.get<IGame>(`${this.baseUrl}/${gameId}`);
	}

	searchGame(options: any) {
		if (this.socket) this.socket.emit('searchGame', options);
	}

	cancelSearchGame() {
		if (this.socket) this.socket.emit('cancelSearchGame');
	}

	getLiveGames(): Observable<IGame[]> {
		return new Observable<IGame[]>((sub) => {
			let games: IGame[] = [];
			this.http.get<IGame[]>(`${this.baseUrl}/live`).subscribe((ret) => {
				if (!ret) return;
				games = ret;
				sub.next(games);
			});

			this.pongService.socket.on('create_game', (game: IGame) => {
				if (
					game &&
					games.findIndex((el) => el.game_id === game.game_id) == -1
				) {
					games.push(game);
					sub.next(games);
				}
			});
			this.pongService.socket.on('delete_game', (gameId: string) => {
				if (gameId) {
					games = games.filter((el) => {
						return el.game_id != gameId;
					});
					sub.next(games);
				}
			});
		});
	}

	updateGames() {
		this.getLiveGames().subscribe((ret) => {
			this._liveGame$.next(ret);
		});
	}

	getUserGames(id: string) {
		return this.http.get<IGame[]>(`${this.baseUrl}/user/${id}`);
	}

	isPlayer(game: IGame) {
		const user = this.pongService.user;
		if (
			user?.user_id == game.player1.user_id ||
			user?.user_id == game.player2.user_id
		)
			return true;
		return false;
	}

	checkPlayerNum(game: Game) {
		const user = this.pongService.user;
		if (user?.user_id === game.player1.id) return 1;
		else return 2;
	}

	openGame(game: IGame) {
		this.pongService.openWindow('pong');
		this.gameSelector$.next(game);
	}
}
