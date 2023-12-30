import {Component, OnInit} from '@angular/core';
import {PongService} from 'app/services/pong.service';
import {UserService} from 'app/services/user.service';
import {IRelationRequest, User} from 'app/classes/User';
import {GameService} from 'app/services/game.service';

@Component({
	selector: 'app-canvas',
	templateUrl: './canvas.component.html',
	styleUrls: [],
})
export class CanvasComponent implements OnInit {
	today: string;
	openWindows: {id: string; open: boolean}[] = [];
	currentUser!: User;

	requests: IRelationRequest[] = [];
	msgNotif = false;

	constructor(
		private userService: UserService,
		private pongService: PongService,
		private gameService: GameService,
	) {
		this.today = new Date(Date.now()).toLocaleDateString();
	}

	ngOnInit(): void {
		if (!this.pongService.user) return;
		this.pongService.user$.subscribe((user) => {
			if (!user) return;
			this.currentUser = user;
		});

		this.userService.getRequests().subscribe((reqs) => {
			this.requests = reqs;
		});

		this.pongService.openWindows.subscribe((win) => {
			this.openWindows = win;
		});
	}

	async logout() {
		await this.pongService.logout();
	}

	openWindow(e: any) {
		this.pongService.openWindow(e);
	}

	closeWindow(e: any, id: string) {
		this.pongService.closeWindow(id);
	}
}
