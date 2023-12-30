import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { IGame } from '../../classes/Game';

@Component({
  selector: 'app-game-card',
  templateUrl: './game-card.component.html',
  styleUrls: []
})
export class GameCardComponent implements OnInit {

  @Input() game!: IGame;
  @Input() show_score!: boolean;
  @Output() chosenGame = new EventEmitter<IGame>();
  
  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {}

  goToGame() {
    this.router.navigate(['game/' + this.game.game_id]);
  }

  chooseGame(e: any, game: IGame) {
	this.chosenGame.emit(game);
  }

}
