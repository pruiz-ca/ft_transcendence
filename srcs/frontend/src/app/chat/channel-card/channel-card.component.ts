import {
	Component,
	OnInit,
	Input,
	Output,
	EventEmitter,
	ViewChild,
	ElementRef,
} from '@angular/core';
import {ChatService} from 'app/services/chat.service';
import {PongService} from 'app/services/pong.service';
import {Channel, ChannelType} from '../../classes/Channel';

@Component({
	selector: 'app-channel-card',
	templateUrl: './channel-card.component.html',
	styleUrls: [],
})
export class ChannelCardComponent implements OnInit {
	@Input() channel!: Channel;
	@Input() admin = false;
	@Output() selectChannelEvent = new EventEmitter<Channel>();
	@ViewChild('wrapper') wrapper!: ElementRef;

	joinRequest = false;
	passwordSubmitted?: string;

	constructor(
		private readonly chatService: ChatService,
		private readonly pongService: PongService,
	) {
		this.chatService.socket.on('joined', (channelId) => {
			if (channelId == this.channel.id) this.channel.registered = true;
		});

		this.chatService.socket.on('left', (channelId) => {
			if (channelId == this.channel.id) this.channel.registered = false;
		});

		this.chatService.socket.on('update', (channel) => {
			if (channel.id == this.channel.id) this.channel.update(channel);
		});
	}

	ngOnInit(): void {
		this.chatService.channels$.subscribe(() => {
			if (this.chatService.channel(this.channel.id))
				this.channel.registered = true;
		});
	}

	channelSelection() {
		this.selectChannelEvent.emit(this.channel);
	}

	getChannelName() {
		if (this.channel.type == ChannelType.PERSONAL)
			return this.channel.users.find(
				(sub) => sub.user_id != this.pongService.user?.user_id,
			)?.username;
		return this.channel.name;
	}

	isPersonal() {
		return this.channel.type == ChannelType.PERSONAL;
	}

	focusUnfocusChannel(e: any, focus: boolean) {
		if (!this.channel.registered) return;
		if (focus) this.wrapper.nativeElement.style.backgroundColor = '#fb923c';
		else
			this.wrapper.nativeElement.style.backgroundColor =
				'rgba(0, 0, 0, 0)';
	}

	joinChannel() {
		if (this.channel.registered) return;

		if (!this.joinRequest && this.channel.hasPassword) {
			this.joinRequest = true;
			return;
		}

		try {
			this.channel.join(this.passwordSubmitted);
		} catch {
			return;
		}
		this.chatService.socket.on('joined', (channelId) => {
			if (channelId == this.channel.id) this.channelSelection();
		});
	}

	cancelJoin() {
		this.joinRequest = false;
		this.passwordSubmitted = undefined;
	}

	deleteChannel() {
		this.chatService
			.deleteChannel(this.channel.id)
			.subscribe(() => this.chatService.socket.emit('socketLog', 'holi'));
	}

	submitPassword() {
		this.joinChannel();
	}
}
