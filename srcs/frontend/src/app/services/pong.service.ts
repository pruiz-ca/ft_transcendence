import {Injectable, OnDestroy} from '@angular/core';
import {CookieService} from 'ngx-cookie-service';
import {IRelationRequest, IUser, User} from '../classes/User';
import {Router} from '@angular/router';
import {map} from 'rxjs/operators';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {io, Socket} from 'socket.io-client';
import {HttpClient} from '@angular/common/http';
import {environment} from 'environments/environment';

@Injectable({
	providedIn: 'root',
})
export class PongService implements OnDestroy {
	private readonly apiUrl = environment.apiUrl; //'http://localhost:3000/'
	private readonly authUrl = `${environment.apiUrl}auth/42`;

	private data = localStorage.getItem('user')
		? JSON.parse(localStorage.getItem('user') || '{}')
		: undefined;

	_user$ = new BehaviorSubject<User | undefined>(this.data);
	user$ = this._user$.asObservable();
	get user() {
		return this._user$.value;
	}

	_openWindows$ = new BehaviorSubject<{id: string; open: boolean}[]>([]);
	openWindows = this._openWindows$.asObservable();

	socket!: Socket;
	openSideNav$ = new Subject<string | null>();

	constructor(
		private cookies: CookieService,
		private router: Router,
		private http: HttpClient,
	) {
		this.update();
		this._user$.subscribe((user) => {
			if (!user) return;
			this.connect();
		});
	}

	ngOnDestroy(): void {
		this.logout();
	}

	update() {
		if (!this.user) return;
		this.storeLoggedUser().subscribe((user) => {
			this._user$.next(user);
		});
	}

	storeLoggedUser() {
		return this.getCurrentUser().pipe(
			map((user) => {
				this._user$.next(user);
				localStorage.setItem('user', JSON.stringify(user));
				return user;
			}),
		);
	}

	saveCookie(token: string) {
		this.cookies.delete('access_token');
		this.cookies.set('access_token', token);
	}

	getCookie() {
		return this.cookies.get('access_token');
	}

	login() {
		window.location.href = this.authUrl;
	}

	async logout(forced: boolean = false) {
		localStorage.clear();
		this._user$.next(undefined);
		this.cookies.delete('access_token');
		if (this.socket && !forced) this.socket.emit('logout');
		await this.router.navigate(['/login']).then(() => {
			window.location.reload();
		});
	}

	// Try to connects the server after getting the cookie
	private connect() {
		if (this.socket) return;
		this.socket = io(this.apiUrl, {
			auth: {token: this.cookies.get('access_token')},
		});

		this.socket.on('error', msg => {
			alert(msg);
		});
		this.socket.on('invalid_token', msg => {
			this.logout(false);
		});
	}

	private getCurrentUser(): Observable<User> {
		return new Observable<User>((sub) => {
			this.http
				.get<IUser>(`${environment.apiUrl}user/me`)
				.subscribe((ret) => {
					if (!ret) return;
					sub.next(new User(ret));
				});
		});
	}

	openWindow(id: string) {
		const windows = this._openWindows$.value;
		const win = windows.find((i) => i.id == id);
		if (win?.open) return;
		windows.push({id: id, open: true});
		this._openWindows$.next(windows);
	}

	closeWindow(id: string) {
		let windows = this._openWindows$.value;
		windows = windows.filter((i) => i.id != id && i.open);
		this._openWindows$.next(windows);
	}
}
