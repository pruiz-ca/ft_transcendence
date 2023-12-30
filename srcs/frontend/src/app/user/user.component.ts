import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { PongService } from '../services/pong.service';
import { UserService } from '../services/user.service';
import { User } from '../classes/User';

@Component({
	selector: 'app-user',
	templateUrl: './user.component.html',
	styleUrls: []
})
export class UserComponent implements OnInit {

	sidenavRef: { mode: any, open: boolean } = { mode: 'over', open: true };
	allUsers: User[] = [];
	allFriends: User[] = [];
	allBlocks: User[] = [];
	searching: boolean = false;
	chosenUser?: User;
	currentUser!: User;
	selected: any;
	ranked: boolean = false; 

	constructor(
		private pongService: PongService,
		private userService: UserService,
		private changeDtetector: ChangeDetectorRef,
		private breakpointObserver: BreakpointObserver
	) { }

	ngOnInit(): void {
		this.breakpointObserver.observe(['(max-width: 640px)']).subscribe((state: BreakpointState) => {
			if (state.matches) {
				this.sidenavRef.open = false;
			} else {
				this.sidenavRef.open = true;
			}
		});

		this.userService.getUsers().subscribe(ret => {
			if (!ret) return;
			this.allUsers = ret;
		});
		this.pongService.user$.subscribe(ret => {
			if (!ret) return;
			this.currentUser = ret;
		});
		this.userService.getFriends(this.currentUser.user_id).subscribe(ret => {
			if (!ret) return;
			this.allFriends = ret;
		});
		this.userService.getUserBlocks().subscribe(ret => {
			if (!ret) return;
			this.allBlocks = ret;
		});
		this.selected = "users";
		
		this.userService.userSelector$.subscribe(user => {
			this.chosenUser = undefined;
			this.changeDtetector.detectChanges();
			this.chosenUser = user;
		});
	}

	getFilter() {
		let users;
		if (this.selected == 'users')
			users = this.allUsers;
		else if (this.selected == 'friends')
			users = this.allFriends;
		else
			users = this.allBlocks;
		if (this.ranked)
			users.sort((a, b) => b.score - a.score );
		else
			users.sort((a,b) => (a.username > b.username) ? 1 : ((b.username > a.username) ? -1 : 0))
		return users;
	}
}
