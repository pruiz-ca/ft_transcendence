import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, map, Observable, Subject, Subscription, takeUntil, takeWhile} from 'rxjs';
import {chatQuery, JoinRequest} from '../classes/ChatQueries';
import {Channel, ChannelType, IChannel} from '../classes/Channel';
import {PongService} from './pong.service';
import {Socket} from 'socket.io-client';
import {environment} from 'environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ChatService {
	// URLs for back requests
	private readonly apiUrl = environment.apiUrl; //'http://localhost:3000/'
	private readonly ChannelsUrl = `${this.apiUrl}channels/`;

	socket!: Socket;

	private _channels$ = new BehaviorSubject<Channel[]>([]);
	channels$ = this._channels$.asObservable();
	get channels() {
		return this._channels$.value;
	}

	channel(channelId: string): Channel | undefined {
		return this.channels.find((channel) => channel.id == channelId);
	}
	channel$(channelId: string): Observable<Channel | undefined> {
		return this.channels$.pipe(
			map((channels) =>
				channels.find((channel) => channel.id == channelId),
			),
		);
	}

	private _channelSelector$ = new BehaviorSubject<string | undefined>(undefined);
	channelSelector$ = this._channelSelector$.asObservable();

	constructor(
		private readonly http: HttpClient,
		private readonly pongService: PongService,
	) {
		Channel.chatService = this;
		this.pongService.user$.subscribe((user) => {
			if (!user) return;

			this.init();

			const channels: Channel[] = [];
			for (const rawChannel of user.channels) {
				channels.push(new Channel(rawChannel));
				this._channels$.next(channels);
			}
		});
	}

	// Will be called when socket is instantiated
	init() {
		this._channelSelector$.next(undefined);
		if (this.socket) return;

		this.socket = this.pongService.socket;

		// Set callback when an event is received
		this.socket.on('joined', (channelId) => {
			this.getChannelById(channelId).subscribe((channel) => {
				const channels = this.channels;
				if (!channel) return;
				channels.push(new Channel(channel));
				this._channels$.next(channels);

				// Resend value so channel component is opened with the value
				if (this._channelSelector$.value == channel.id) {
					this._channelSelector$.next(channel.id);
				}
			});
		});

		this.socket.on('left', (channelId) => {
			const channels = this.channels.filter((channel) => {
				return channel.id != channelId;
			});
			this._channels$.next(channels);
			this._channelSelector$.next(undefined);
		});

		this.socket.on(
			'message',
			(data: {text: string; to: string; fromId: string, fromUsername: string}) => {
				if (this.pongService.user?.blockIds?.includes(data.fromId))
					return;
				this.receiveMessage(data);
			},
		);

		this.socket.on('update', (data: {channel: IChannel}) => {
			this.updateChannel(data.channel);
		});
	}

	// Gets channel info
	private getChannelById(channelId: string): Observable<IChannel> {
		return this.http.get<IChannel>(`${this.ChannelsUrl}${channelId}`);
	}

	// Get all channels
	getChannels(): Observable<Channel[]> {
		return new Observable<Channel[]>((subscriber) => {
			const channels: Channel[] = [];
			this.http
				.get<IChannel[]>(this.ChannelsUrl)
				.subscribe((fetchedChannels) => {
					channels.push(
						...fetchedChannels.map(
							(channel) => new Channel(channel),
						),
					);
					subscriber.next(channels);
				});

			// This let us charge new channels in real time
			this.socket.on('channel-creation', (channel_id) => {
				this.getChannelById(channel_id).subscribe((channel) => {
					channels.push(new Channel(channel));
					subscriber.next(channels);
				});
			});

			this.socket.on('channel-removed', (channel_id) => {
				const index = channels.findIndex((e) => e.id == channel_id);
				if (index >= 0) channels.splice(index, 1);
				subscriber.next(channels);
			});
		});
	}

	// Send message event to backend server
	sendChatQuery(message: chatQuery) {
		if (this.socket != null) this.socket.emit('chat', message);
	}

	async createChannel(name: string, passwd: string, type: ChannelType): Promise<Channel> {
		let channel = this.channels.find(channel => channel.name == name)
		if (channel)
			return channel;
		
		this.sendChatQuery(new JoinRequest(name, passwd, type));

		const terminate = new Subject<void>();

		return new Promise<Channel>((resolve, reject) => {
			this.channels$.pipe(takeUntil(terminate)).subscribe(channels => {
				const channel = channels.find(e => {
					if (type == ChannelType.PERSONAL && e.type == ChannelType.PERSONAL)
						return e.users.find(user => user.user_id == name)? true : false;
					return e.name == name;	
				});
				if (!channel)
					return;
				if (type == ChannelType.PRIVATE)
					channel.setPrivate(true);
				resolve(channel);
				terminate.next();
			});
		});

	}

	openChat(channelId: string) {
		this.pongService.openWindow('chat');
		this._channelSelector$.next(channelId);
	}

	receiveMessage(data: {text: string; to: string; fromId: string; fromUsername: string}) {
		const channel = this.channel(data.to);
		if (!channel) return;
		channel.notRead++;
		if (!channel.messages) channel.messages = [];
		channel.messages.push({text: data.text, fromId: data.fromId, fromUsername: data.fromUsername});
		this._channels$.next(this.channels);
	}

	updateChannel(channelDto: IChannel) {
		const channel = this.channels.find(channel=> channel.id == channelDto.id);
		if (!channel)
			return;
		channel.update(channelDto);
		this._channels$.next(this.channels);
	}

	channelFilter(channel: Channel, text: string): boolean {
		return channel.name.startsWith(text.toLowerCase());
	}

	goToChat(targetId: string, channelType?: ChannelType): void {
		const channel: any = this.channels.find((ch) => {
			if (
				channelType == ChannelType.PERSONAL &&
				ch.type == ChannelType.PERSONAL
			)
				return ch.users.find((user) => user.user_id == targetId)
					? true
					: false;
			return ch.id == targetId;
		});
		if (!channel && channelType == ChannelType.PERSONAL) {
			this.createChannel(targetId, '', ChannelType.PERSONAL)
				.then(channel => {
					this.openChat(channel.id)
				});
		}
		if (channel)
			this.openChat(channel.id);
	}

	updateChanImage(channel_id: string, image: string) {
		if (!this.socket) return;
		this.socket.emit('update_channel', {channel_id, image});
	}

	deleteChannel(channelId: string) {
		return this.http.delete(`${this.ChannelsUrl}${channelId}`);
	}
}
