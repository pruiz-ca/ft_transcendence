import {
	Component,
	ElementRef,
	EventEmitter,
	Host,
	HostListener,
	Input,
	OnChanges,
	OnInit,
	Output,
	SimpleChanges,
	ViewChild,
} from '@angular/core';
import {IGame} from 'app/classes/Game';
import {RelationStatus, User} from 'app/classes/User';
import {GameService} from 'app/services/game.service';
import {PongService} from 'app/services/pong.service';
import {UserService} from 'app/services/user.service';

@Component({
	selector: 'app-user-card',
	templateUrl: './user-card.component.html',
	styleUrls: ['./user-card.component.css'],
})
export class UserCardComponent implements OnInit, OnChanges {
	@Input() user!: User;
	@ViewChild('user_card') user_card!: ElementRef;
	clicked = false;
	mouseXPos = 0;

	games: IGame[] = [];
	can_relate!: boolean;
	friendStatus!: RelationStatus;
	challengeStatus!: RelationStatus;
	isBlocked = false;

	constructor(
		private userService: UserService,
		private pongService: PongService,
		private gameService: GameService,
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		this.pongService.user$.subscribe((ret) => {
			if (!ret) return;
			if (ret.user_id === this.user.user_id) {
				this.can_relate = false;
			} else this.can_relate = true;
			this.gameService
				.getUserGames(this.user.user_id)
				.subscribe((ret) => {
					if (!ret) return;
					this.games = ret;
				});
			this.updateFriendRequestStatus();
			this.updateChallengeRequestStatus();
			this.isUserBlocked();
		});
	}

	ngOnInit(): void {}

	challengePlayer(user: User) {
		user.challenge();
		this.challengeStatus = RelationStatus.PENDING;
	}

	chat(user: User) {
		user.chat();
	}

	sendFriendRequest() {
		this.userService.sendFriendRequest(this.user.user_id);
		this.friendStatus = RelationStatus.PENDING;
	}

	removeFriend() {
		this.userService.removeFriend(this.user.user_id);
		this.friendStatus = RelationStatus.NOT_SENT;
	}

	blockUser() {
		this.userService.blockUser(this.user.user_id).subscribe(() => {
			if (!this.pongService.user) return;
			this.pongService.update();
			this.isUserBlocked();
		});
	}

	unblockUser() {
		this.userService.unblockUser(this.user.user_id).subscribe(() => {
			if (!this.pongService.user) return;
			this.pongService.update();
			this.isUserBlocked();
		});
	}

	updateFriendRequestStatus() {
		this.userService
			.getRequestStatus(this.user.user_id, 'friend')
			.subscribe((ret) => {
				this.friendStatus = ret.status;
			});
	}

	updateChallengeRequestStatus() {
		this.userService
			.getRequestStatus(this.user.user_id, 'challenge')
			.subscribe((ret) => {
				this.challengeStatus = ret.status;
			});
	}

	isUserBlocked() {
		this.userService.getUserBlocks().subscribe((ret) => {
			this.isBlocked = this.userService.isUserBlocked(
				this.user.user_id,
				ret,
			);
		});
	}

	//EVENTS
	@HostListener('mousedown', ['$event'])
	mouseDown(event: any) {
		this.mouseXPos = event.clientX;
		this.clicked = true;
	}

	@HostListener('mouseup', ['$event'])
	mouseUp(event: any) {
		this.clicked = false;
	}

	@HostListener('mousemove', ['$event'])
	mouseMove(event: any) {
		if (!this.clicked) return;
		const rotateY = event.clientX - this.mouseXPos;
		this.user_card.nativeElement.style.transform = `perspective(180rem) rotateX(20deg) rotateY(${rotateY}deg)`;
	}

	@HostListener('touchstart', ['$event'])
	touchStart(event: any) {
		this.mouseXPos = event.targetTouches[0].clientX;
		this.clicked = true;
	}

	@HostListener('touchend', ['$event'])
	touchEnd(event: any) {
		this.clicked = false;
	}

	@HostListener('touchmove', ['$event'])
	touchMove(event: any) {
		if (!this.clicked) return;
		const rotateY = event.targetTouches[0].clientX - this.mouseXPos;
		this.user_card.nativeElement.style.transform = `perspective(50rem) rotateX(20deg) rotateY(${rotateY}deg)`;
	}
}
