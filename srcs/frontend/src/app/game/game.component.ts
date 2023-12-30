import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {IGame} from '../classes/Game';
import {GameService} from '../services/game.service';
import {BreakpointObserver, BreakpointState} from '@angular/cdk/layout';

@Component({
	selector: 'app-game',
	templateUrl: './game.component.html',
	styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
	sidenavRef: { mode: any; open: boolean } = { mode: 'over', open: true };
	liveGames: IGame[] = [];
	waiting = false;
	matchmaking = false;
	fromMatchmaking = false;
	newGame = false;
	options!: {ranked: boolean; powerups: boolean};
	playing = false;

	selectedGame?: IGame;
	constructor(
		private gameService: GameService,
		private changeDtetector: ChangeDetectorRef,
		private breakpointObserver: BreakpointObserver,
	) {}

	ngOnInit(): void {
		this.breakpointObserver
			.observe(['(max-width: 640px)'])
			.subscribe((state: BreakpointState) => {
				if (state.matches || this.playing) {
					this.sidenavRef.open = false;
				} else {
					this.sidenavRef.open = true;
				}
			});
		this.gameService.getLiveGames().subscribe((ret) => {
			this.liveGames = ret;
		});

		this.gameService.gameSelector$.subscribe((ret) => {
			this.selectedGame = undefined;
			this.changeDtetector.detectChanges();
			if (!ret) this.playing = false;
			this.newGame = false;
			this.selectedGame = ret;
		});
	}

	chooseGame(game: IGame) {
		this.gameService.openGame(game);
		this.fromMatchmaking = false;
		this.matchmaking = false;
		this.sidenavRef.open = false;
	}

	cancelSearch() {
		this.waiting = false;
		this.gameService.cancelSearchGame();
	}

	searchGame($event: {ranked: boolean; powerups: boolean}) {
		this.options = $event;
		this.waiting = true;
		this.fromMatchmaking = true;
		this.matchmaking = true;
		this.gameService.searchGame($event);
		this.sidenavRef.open = false;
	}

	restrictGame() {
		this.playing = true;
		this.matchmaking = false;
		this.waiting = false;
		this.sidenavRef.open = false;
	}
}
