import {
	AfterViewInit,
	Component,
	EventEmitter,
	Input,
	OnInit,
	Output,
} from '@angular/core';
import {IUpdateUserInfo, IUser, User} from 'app/classes/User';
import {GameService} from 'app/services/game.service';
import {PongService} from 'app/services/pong.service';
import {UserService} from 'app/services/user.service';
import {environment} from 'environments/environment';
import Swal from 'sweetalert2';

@Component({
	selector: 'app-me',
	templateUrl: './me.component.html',
	styleUrls: [],
})
export class MeComponent implements OnInit {
	@Input() user!: User;
	@Input() display = true;
	@Output() save = new EventEmitter();

	mod_2fa!: boolean;
	qrCode!: string | null;
	code!: string;
	is_editing = false;
	tmp_avatar!: string;
	tmp_username!: string;
	delete = false;

	constructor(
		private readonly pongService: PongService,
		private readonly userService: UserService,
	) {}

	ngOnInit(): void {
		this.tmp_avatar = this.user.avatar;
		this.tmp_username = this.user.username;
		this.mod_2fa = this.user.two_fa;
	}

	saveProfile() {
		this.tmp_username = this.tmp_username.trim();
		if (this.tmp_username.length > 8 || this.tmp_username.length <= 0) {
			return;
		}
		const modUsername = this.tmp_username;
		const newUser: IUpdateUserInfo = {
			username: modUsername,
			avatar: this.tmp_avatar,
		};
		this.userService.editUserSettings(newUser).subscribe((ret: IUser) => {
			if (!ret) return;
			this.pongService.update();
			this.is_editing = false;
			this.qrCode = null;
			this.code = '';
			this.user.avatar = newUser.avatar;
			this.user.username = newUser.username;
			this.pongService._user$.next(this.user);
			this.save.emit();
		});
	}

	deleteProfile() {
		this.userService.deleteAccount(this.user.user_id).subscribe((ret) => {
			this.pongService.logout();
		});
	}

	uploadPic(e: any) {
		const file: File = e.target.files[0];

		if (file) {
			const formData = new FormData();
			formData.append('file', file);
			this.userService.uploadImage(formData).subscribe(() => {
				this.tmp_avatar = `${environment.apiUrl}assets/${file.name}`;
			});
		}
	}

	cancel() {
		this.tmp_avatar = this.user.avatar;
		this.mod_2fa = this.user.two_fa;
		this.qrCode = null;
		this.is_editing = false;
		this.delete = false;
	}

	toggleTwoFa() {
		if (!this.mod_2fa) {
			this.userService.deactivateTwoFa().subscribe();
			this.qrCode = null;
			this.mod_2fa = false;
			return;
		}
		this.userService.generateQrCode().subscribe((ret) => {
			this.qrCode = ret;
		});
	}

	limitNums(event: any) {
		event.target.value = event.target.value.replace(/[^0-9]/g, '');
	}

	activateTwoFa(e: any) {
		const tmp = this.code;
		this.code = '';
		if (!tmp || tmp.length != 6) return;
		this.userService.activateTwoFa(tmp).subscribe((ret: any) => {
			if (ret.token) {
				Swal.fire({
					title: 'Success',
					icon: 'success',
					toast: true,
					position: 'top-right',
					background: '#424242fa',
					color: '#fff',
					showConfirmButton: false,
					timer: 2000,
				});
				this.pongService.saveCookie(ret.token);
			}
			this.qrCode = null;
		});
	}
}
