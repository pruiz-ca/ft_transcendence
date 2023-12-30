import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';

import {
	AdminAction,
	IFriendRequestStatus,
	IRelationRequest,
	IUpdateUserInfo,
	IUser,
	RelationStatus,
	RelationType,
	TwoFaCode,
	User,
} from '../classes/User';
import {PongService} from './pong.service';
import {environment} from 'environments/environment';
import {INotification} from 'app/classes/Notification';
import {Router} from '@angular/router';
import {ChatService} from './chat.service';
import {ChannelType} from 'app/classes/Channel';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	private readonly userUrl = `${environment.apiUrl}user`;
	private readonly currentUserUrl = `${environment.apiUrl}user/me`;

	userSelector$ = new BehaviorSubject<User | undefined>(undefined);
	constructor(
		private http: HttpClient,
		private pongService: PongService,
		private chatService: ChatService,
	) {
		User.userService = this;
		this.pongService.user$.subscribe((user) => {
			if (!user) return;

			this.pongService.socket.on('expelled', () => {
				this.pongService.logout(true);
			});
		});
	}

	getUsers(): Observable<User[]> {
		return new Observable<User[]>((sub) => {
			let users: User[] = [];
			this.http.get<IUser[]>(this.userUrl).subscribe((ret: IUser[]) => {
				if (!ret) return;
				for (const rawUser of ret) users.push(new User(rawUser));
				sub.next(users);
			});
			this.pongService.socket.on('add_user', (data: {user: IUser}) => {
				if (
					data.user &&
					users.findIndex((el) => el.user_id === data.user.user_id) ==
						-1
				) {
					users.push(new User(data.user));
					sub.next(users);
				}
			});
			this.pongService.socket.on(
				'delete_user',
				(data: {user_id: string}) => {
					if (data.user_id) {
						users = users.filter((el) => {
							return el.user_id != data.user_id;
						});
						sub.next(users);
					}
				},
			);
		});
	}

	getCurrentUser() {
		return new Observable<User>((sub) => {
			this.http.get<IUser>(this.currentUserUrl).subscribe((ret) => {
				if (!ret) return;
				sub.next(new User(ret));
			});
		});
	}

	getUser(user_id: string): Observable<User> {
		return new Observable<User>((sub) => {
			this.http
				.get<IUser>(`${this.userUrl}/${user_id}`)
				.subscribe((ret) => {
					if (!ret) return;
					sub.next(new User(ret));
				});
		});
	}

	editUserSettings(newUser: IUpdateUserInfo) {
		return this.http.patch<IUser>(`${this.userUrl}`, newUser);
	}

	deleteAccount(user_id: string) {
		return this.http.delete(`${this.userUrl}/${user_id}`);
	}

	uploadImage(formData: FormData) {
		return this.http.post(`${environment.apiUrl}upload`, formData);
	}

	/*
	 ** USER RELATED METHODS
	 */
	goToProfile(user: User) {
		this.pongService.openWindow('users');
		this.userSelector$.next(user);
	}

	openUserChat(userId: string) {
		this.chatService.goToChat(userId, ChannelType.PERSONAL);
	}

	/*
	 **  FRIEND RELATED FUNCTIONS
	 */
	sendFriendRequest(friend: string) {
		const notif: INotification = {
			action: 'send',
			type: 'friend',
			receiver: friend,
		};
		if (this.pongService.socket)
			this.pongService.socket.emit('notifs', notif);
	}

	removeFriend(friend: string) {
		const notif: INotification = {
			action: 'remove',
			type: 'friend',
			receiver: friend,
		};
		if (this.pongService.socket)
			this.pongService.socket.emit('notifs', notif);
	}

	getFriends(id: string): Observable<User[]> {
		return new Observable<User[]>((sub) => {
			let friends: User[] = [];
			this.http
				.get<IUser[]>(`${this.userUrl}/relation/friends/${id}`)
				.subscribe((ret: IUser[]) => {
					if (!ret) return;
					for (const rawFriend of ret)
						friends.push(new User(rawFriend));
					sub.next(friends);
				});

			this.pongService.socket.on('remove_friend', (ret) => {
				if (ret) {
					if (ret.sender.user_id == id)
						friends = friends.filter(
							(el) => el.user_id !== ret.receiver.user_id,
						);
					else if (ret.receiver.user_id == id)
						friends = friends.filter(
							(el) => el.user_id !== ret.sender.user_id,
						);
					sub.next(friends);
				}
			});

			this.pongService.socket.on('accept_friend', (ret) => {
				if (ret.relation_type == RelationType.FRIEND) {
					if (ret.sender.user_id != id)
						friends.push(new User(ret.sender));
					else if (ret.receiver.user_id != id)
						friends.push(new User(ret.receiver));
					sub.next(friends);
				}
			});
		});
	}

	/*
	 **  REQUEST RELATED FUNCTIONS
	 */
	getRequests() {
		return new Observable<IRelationRequest[]>((sub) => {
			let requests: IRelationRequest[];
			this.http
				.get<IRelationRequest[]>(`${this.userUrl}/relation/requests`)
				.subscribe((ret: IRelationRequest[]) => {
					if (ret) {
						requests = ret;
						sub.next(requests);
					}
				});
			this.pongService.socket.on('received_request', (req) => {
				if (
					req &&
					requests.findIndex(
						(el) => el.relation_id === req.relation_id,
					) == -1
				) {
					requests.push(req);
					sub.next(requests);
				}
			});
			this.pongService.socket.on('decline_request', (ret) => {
				requests = requests.filter(
					(el) =>
						el.sender.username !== ret.sender.username &&
						el.receiver.username !== ret.receiver.username,
				);
				sub.next(requests);
			});
			this.pongService.socket.on('accept_request', (ret) => {
				requests = requests.filter(
					(el) =>
						el.sender.username !== ret.sender.username &&
						el.receiver.username !== ret.receiver.username,
				);
				sub.next(requests);
			});
		});
	}

	getRequestStatus(receiver_id: string, type: 'friend' | 'challenge') {
		return this.http.get<IFriendRequestStatus>(
			`${this.userUrl}/relation/${type}/${receiver_id}`,
		);
	}

	respondRequest(
		response: RelationStatus,
		reqId: string,
		type: 'friend' | 'challenge',
	) {
		const notif: INotification = {
			action: response == RelationStatus.ACCEPTED ? 'accept' : 'decline',
			type: type,
			request_id: reqId,
		};
		if (this.pongService.socket)
			this.pongService.socket.emit('notifs', notif);
	}

	/*
	 **  2FA
	 */
	generateQrCode() {
		return this.http.get(`${environment.apiUrl}auth/2fa`, {
			responseType: 'text',
		});
	}

	activateTwoFa(code: string) {
		const twoCode: TwoFaCode = {code: code};
		return this.http.post(
			`${environment.apiUrl}auth/2fa/activate`,
			twoCode,
		);
	}

	authenticateTwoFa(code: string) {
		const twoCode: TwoFaCode = {code: code};
		return this.http.post(
			`${environment.apiUrl}auth/2fa/authenticate`,
			twoCode,
		);
	}

	deactivateTwoFa() {
		return this.http.post(`${environment.apiUrl}auth/2fa/deactivate`, {});
	}

	/*
	 **  BLOCK RELATED FUNCTIONS
	 */
	blockUser(user_id: string) {
		return this.http.post(`${this.userUrl}/relation/block/${user_id}`, {});
	}

	unblockUser(user_id: string) {
		return this.http.delete(`${this.userUrl}/relation/block/${user_id}`);
	}

	getUserBlocks(): Observable<User[]> {
		return new Observable<User[]>((sub) => {
			const blocks: User[] = [];
			this.http
				.get<IUser[]>(`${this.userUrl}/relation/blocks/`)
				.subscribe((ret) => {
					if (!ret) return;
					for (const rawBlock of ret) blocks.push(new User(rawBlock));
					sub.next(blocks);
				});
		});
	}

	isUserBlocked(user_id: string, blocks: any[]) {
		return blocks.some((user) => {
			return user.user_id === user_id;
		});
	}

	/*
	 ** Challenges
	 */
	challengeUser(user_id: string) {
		const notif: INotification = {
			action: 'send',
			type: 'challenge',
			receiver: user_id,
		};
		if (this.pongService.socket)
			this.pongService.socket.emit('notifs', notif);
	}

	// Function used for filtering when seraching
	userFilter(user: User, text: string): boolean {
		return user.username.startsWith(text.toLowerCase());
	}

	exerciseAdminRights(user: User, action: {action: AdminAction}) {
		return this.http.patch(`${this.userUrl}/${user.user_id}`, action);
	}
}
