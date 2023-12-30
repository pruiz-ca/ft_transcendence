import { ChatService } from '../services/chat.service';
import { Channel, ChannelType } from '../classes/Channel';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
		
	sidenavRef: { mode: any, open: boolean } = { mode: 'over', open: true };

	channels: Channel[] = [];
	isAddingChannel: boolean = false;
	passwordSubmitted?: string;

	isCreating: boolean = false;
	isSearching: boolean = false;

	channel?: Channel;

	constructor(
		readonly chatService: ChatService,
		private changeDtetector: ChangeDetectorRef,
		private breakpointObserver: BreakpointObserver
	) {}

	ngOnInit(): void {
		this.breakpointObserver.observe(['(max-width: 640px)']).subscribe((state: BreakpointState) => {
			if (state.matches) {
				this.sidenavRef.open = false;
			} else {
				this.sidenavRef.open = true;
			}
		});

		this.chatService.channels$.subscribe(channels => {
			this.channels = channels.filter(channel => channel.type != ChannelType.GAME);
		});

		this.chatService.channelSelector$.subscribe(channelId => {
			this.channel = undefined;
			this.changeDtetector.detectChanges();
			if (!channelId)
				return;
			this.channel = this.chatService.channel(channelId);
		});
	}

	getChannel(channelId: string | null): Channel | undefined {
		if (!channelId)
			return undefined;
		return this.chatService.channel(channelId)!;
	}

	channel$(channelId: string) {
		return this.chatService.channel$(channelId);
	}

	addChannel(): void {
		this.isAddingChannel = true;
	}

	selectChannel(channel: Channel) {
		if (channel.registered) {
			this.sidenavRef.open = false;
			this.isSearching = false;
			return this.chatService.openChat(channel.id);
		}
	}

	displayChannelCard(data: any): boolean {
		if (data.type == ChannelType.DEFAULT)
			return true;
		return false;
	}

	channelFilter = this.chatService.channelFilter;
}
