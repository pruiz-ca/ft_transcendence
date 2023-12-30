import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { User } from 'app/classes/User';
import { ChatService } from 'app/services/chat.service';
import { UserService } from 'app/services/user.service';
import { ChannelType } from '../../classes/Channel';

@Component({
	selector: 'app-channel-creator',
	templateUrl: './channel-creator.component.html',
	styleUrls: []
})
export class ChannelCreatorComponent implements OnInit, OnDestroy {

	buttonText: string = 'Join';
	
	name!: string;
	passwd!: string;
	users = this.userService.getUsers();

	@Output() close = new EventEmitter;
	@Output() closeAll = new EventEmitter;

	constructor(
		private readonly chatService: ChatService,
		private readonly userService: UserService,  
	) {}
	
	ngOnDestroy(): void {
		this.close.emit();
	}

	ngOnInit(): void {}

	backToChats() {
		this.close.emit();
	}

	onSubmit() {
		if (this.name.length <= 0) return;
		this.chatService.createChannel(this.name, this.passwd, ChannelType.DEFAULT)
			.then(channel => {
				this.chatService.openChat(channel.id);
			});
		this.backToChats();
	}

	closeSidenav() {
		this.closeAll.emit();
	}

	userFilter(user: User, text: string) {
		return this.userService.userFilter(user, text);
	}
}
