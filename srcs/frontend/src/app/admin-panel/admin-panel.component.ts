import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {UserService} from '../services/user.service';
import {PongService} from 'app/services/pong.service';
import {AdminAction, User} from 'app/classes/User';
import {ChatService} from 'app/services/chat.service';
import {Channel} from 'app/classes/Channel';
import { UserAction } from 'app/user/user-thumbnail/user-thumbnail.component';

@Component({
	selector: 'app-admin-panel',
	templateUrl: './admin-panel.component.html',
	styleUrls: [],
})
export class AdminPanelComponent implements OnInit {
	allUsers: User[] = [];
	allChannels = this.chatService.getChannels();

	userCardMethods: UserAction[] = [
		{ name: 'Make admin', function: this.makeAdmin() },
		{ name: 'Remove admin', function: this.removeAdmin() },
		{ name: 'Ban user', function: this.banUser() },
		{ name: 'Unban user', function: this.unbanUser() },
	]

	constructor(
		private userService: UserService,
		private router: Router,
		private pongService: PongService,
		private chatService: ChatService,
	) {}

	ngOnInit(): void {
		this.pongService.user$.subscribe((ret) => {
			if (!ret || !ret.hasAdminPermissions()) this.router.navigate(['/']);
		});
		this.userService.getUsers().subscribe((ret) => {
			this.allUsers = ret.filter((user) => {
				return user.user_id != this.pongService.user?.user_id;
			});
		});
	}

	selectChannel(channel: Channel) {
		return this.chatService.openChat(channel.id);
	}

	isCurrentUser(user: User) {
		if (user.user_id === this.pongService.user?.user_id) return true;
		return false;
	}

	makeAdmin() {
		return (user: User) => {
			this.userService.exerciseAdminRights(user, { action: AdminAction.ADMIN }).subscribe();
		}
	}

	removeAdmin() {
		return (user: User) => {
			this.userService.exerciseAdminRights(user, { action: AdminAction.UNADMIN }).subscribe();
		}
	}

	banUser() {
		return (user: User) => {
			this.userService.exerciseAdminRights(user, { action: AdminAction.BAN }).subscribe();
		}
	}

	unbanUser() {
		return (user: User) => {
			this.userService.exerciseAdminRights(user, { action: AdminAction.UNBAN }).subscribe();
		}
	}
}
