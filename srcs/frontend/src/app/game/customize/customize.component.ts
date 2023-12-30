import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-customize',
  templateUrl: './customize.component.html',
  styleUrls: []
})
export class CustomizeComponent implements OnInit {

  @Output() start = new EventEmitter<{ ranked: boolean, powerups: boolean }>();
  powerups: boolean = false;
  ranked: boolean = false;

  constructor() { }

  ngOnInit(): void {}

  startGame() {
    this.start.emit({ ranked: this.ranked, powerups: this.powerups });
  }

}
