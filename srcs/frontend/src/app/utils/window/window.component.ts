import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { User } from 'app/classes/User';
import { UserService } from 'app/services/user.service';

@Component({
	selector: 'app-window',
	templateUrl: './window.component.html',
	styleUrls: []
})
export class WindowComponent implements OnInit {

	@Input() window: any;
	@Output() close = new EventEmitter<string>();
	users = this.userService.getUsers();

	constructor(
		private readonly userService: UserService
		) { }

	ngOnInit(): void {}

	closeWindow(e: any, id: string) {
		this.close.emit(id);
	}

	userFilter(user: User, text: string) {
		return this.userService.userFilter(user, text);
	}

}
