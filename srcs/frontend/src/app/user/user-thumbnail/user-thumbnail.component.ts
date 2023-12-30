import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { User } from '../../classes/User';
import { PongService } from '../../services/pong.service';
import { UserService } from '../../services/user.service';

export interface UserAction {
	name: string;

	function: (user: any) => void;

}

@Component({
	selector: 'app-user-thumbnail',
	templateUrl: './user-thumbnail.component.html',
	styleUrls: []
})
export class UserThumbnailComponent implements OnInit {

	@Input() user!: User;
	@Input() ranked!: boolean;
	displayable: boolean = true;
	menu: boolean = false;

	@Input() extraActions?: UserAction[];
	actions: UserAction[] = [
		{ name: 'Profile', function: this.openProfile },
		{ name: 'Challenge', function: this.challengePlayer },
		{ name: 'Chat', function: this.chat }
	];

	constructor(private pongService: PongService) { }

	ngOnInit(): void {
		if (this.extraActions)
			this.actions.push(...this.extraActions);
		this.pongService.user$.subscribe(ret => {
			if (ret?.user_id == this.user.user_id)
				this.displayable = false;
			else
				this.displayable = true;
		});
	}

	openProfile(user: User) {
		user.goToProfile();
	}

	challengePlayer(user: User) {
		user.challenge();
	}

	chooseUser(e: any, user: User) {
		user.goToProfile();
	}

	chat(user: User) {
		user.chat();
	}

	execAction(action: (user: User) => void): void {
		action(this.user);
	}

	isUser(): boolean {
		if ('type' in this.user)
			return false;
		return true;
	}
}
