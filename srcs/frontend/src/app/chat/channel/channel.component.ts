import {
	Component,
	OnInit,
	Output,
	EventEmitter,
	Input,
	ElementRef,
	ViewChild,
	AfterViewChecked,
	OnDestroy,
} from '@angular/core';
import {Channel, ChannelType} from '../../classes/Channel';
import {PongService} from 'app/services/pong.service';
import {User} from 'app/classes/User';
import {ChannelMember, SubType} from 'app/classes/ChannelMember';
import {ChatService} from 'app/services/chat.service';
import {UserService} from '../../services/user.service';
import {environment} from '../../../environments/environment';
import {UserAction} from '../../user/user-thumbnail/user-thumbnail.component';

@Component({
	selector: 'app-channel',
	templateUrl: './channel.component.html',
	styleUrls: [],
})
export class ChannelComponent implements OnInit, OnDestroy, AfterViewChecked {
	isPrivate = false;
	hasPassword = false;

	newPassw!: string;

	@Input() channel!: Channel;

	submission!: string;
	@ViewChild('textInput') textInput!: ElementRef<HTMLInputElement>;

	@Output() close = new EventEmitter();

	isSetting = false;
	user: User | undefined = undefined;
	isGame!: boolean;

	constructor(
		private pongService: PongService,
		private chatService: ChatService,
		private userService: UserService,
	) {
		this.user = this.pongService.user;
	}

	ngOnInit(): void {
		this.chatService.channel$(this.channel.id).subscribe((channel) => {
			if (!channel) return;
			this.update(channel);
		});
	}

	ngOnDestroy(): void {
		this.close.emit();
	}

	ngAfterViewChecked() {
		// if (this.textInput)
		// 	this.textInput.nativeElement.focus();
	}

	update(channel: Channel) {
		this.channel = channel;
		this.isPrivate = channel.type == ChannelType.PRIVATE ? true : false;
		this.hasPassword = channel.hasPassword;
		this.isGame = this.channel.type == ChannelType.GAME ? true : false;
		channel.notRead = 0;
	}

	get users() {
		return this.channel.users.filter((sub) => sub.subtype != SubType.BAN);
	}

	get bans() {
		return this.channel.users.filter((sub) => sub.subtype == SubType.BAN);
	}

	onSubmit(): void {
		this.submission = this.submission.trim();
		if (this.submission.length <= 0) return;
		this.channel.message(this.submission);
		this.submission = '';
	}

	get admin() {
		return this.channel.isAdmin(this.user!.user_id);
	}

	showSettings() {
		return this.channel.type != ChannelType.PERSONAL;
	}

	leave() {
		this.channel.leave();
		this.backToChats();
	}

	togglePrivate() {
		this.channel.setPrivate(
			this.channel.type == ChannelType.PRIVATE ? false : true,
		);
	}

	togglePassword() {
		if (!this.hasPassword) this.channel.changePassw();
	}

	submitPassword() {
		this.channel.changePassw(this.newPassw);
		this.newPassw = '';
	}

	toggleSettings(): void {
		this.isSetting = !this.isSetting;
	}

	backToChats() {
		this.close.emit();
	}

	getChannelName() {
		if (this.channel.type == ChannelType.GAME) return '';

		if (this.channel.type == ChannelType.PERSONAL)
			return this.channel.users.find(
				(sub) => sub.user_id != this.pongService.user?.user_id,
			)?.username;
		return this.channel.name;
	}

	isPersonal() {
		if (this.channel.type == ChannelType.PERSONAL) return true;
		return false;
	}

	// User-card methods
	readonly userCardMethods: UserAction[] = [
		{name: 'Ban', function: this.banUser()},
		{name: 'Set admin', function: this.makeAdmin()},
		{name: 'Unset admin', function: this.removeAdmin()},
		{name: 'Kick', function: this.kickUser()},
	];

	readonly banCardMethods: UserAction[] = [
		{name: 'Unban', function: this.unBanUser()},
	];

	banUser() {
		return (user: ChannelMember) => {
			user.channelBan(this.channel);
		};
	}

	unBanUser() {
		return (user: ChannelMember) => {
			user.channelUnBan(this.channel);
		};
	}

	makeAdmin() {
		return (user: ChannelMember) => {
			user.channelOp(this.channel);
		};
	}

	removeAdmin() {
		return (user: ChannelMember) => {
			user.channelUnOp(this.channel);
		};
	}

	kickUser() {
		return (user: ChannelMember) => {
			user.channelKick(this.channel);
		};
	}

	uploadPic(e: any) {
		const file: File = e.target.files[0];

		if (file) {
			const formData = new FormData();
			formData.append('file', file);
			this.userService.uploadImage(formData).subscribe(() => {
				this.channel.avatar = `${environment.apiUrl}assets/${file.name}`;
				this.chatService.updateChanImage(
					this.channel.id,
					this.channel.avatar,
				);
			});
		}
	}

	allowSettings() {
		if (this.channel.type == ChannelType.GAME) return false;
		return true;
	}
}
