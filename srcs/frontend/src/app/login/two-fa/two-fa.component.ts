import {
	Component,
	ElementRef,
	OnInit,
	QueryList,
	ViewChildren,
} from '@angular/core';
import {Router} from '@angular/router';
import {PongService} from 'app/services/pong.service';
import {UserService} from 'app/services/user.service';

@Component({
	selector: 'app-two-fa',
	templateUrl: './two-fa.component.html',
	styleUrls: ['./two-fa.component.css'],
})
export class TwoFaComponent implements OnInit {
	@ViewChildren('inputs') inputs!: QueryList<ElementRef>;
	constructor(
		private userService: UserService,
		private router: Router,
		private pongService: PongService,
	) {}

	ngOnInit(): void {
		localStorage.setItem('inTwoFa', 'true');
	}

	handleOnPasteOtp(e: any) {
		const data = e.clipboardData.getData('text');
		const value = data.split('');
		if (value.length == this.inputs.length) {
			this.inputs.forEach(
				(input, index) => (input.nativeElement.value = value[index]),
			);
			this.submit();
		}
	}

	handleOtp(e: any, index: number) {
		const input = e.target;
		const value = input.value;
		input.value = '';
		input.value = value ? value[0] : '';

		if (value.length > 0 && index < this.inputs.length - 1)
			input.nextElementSibling.focus();
		if (e.key === 'Backspace' && index > 0)
			input.previousElementSibling.focus();
		if (index == this.inputs.length - 1) this.submit();
	}

	submit() {
		let otp = '';
		this.inputs.forEach((input) => {
			otp += input.nativeElement.value;
			input.nativeElement.disabled = true;
			input.nativeElement.classList.add('disabled');
		});
		if (otp.length != 6) {
			this.cleanInput();
			return;
		}
		this.userService.authenticateTwoFa(otp).subscribe((res: any) => {
			if (res.token) {
				this.pongService.saveCookie(res.token);
				this.router.navigate(['/']);
				localStorage.removeItem('inTwoFa');
			}
		});
		setTimeout(() => {
			this.cleanInput();
		}, 1000);
	}

	cleanInput() {
		this.inputs.forEach((input) => {
			input.nativeElement.value = '';
			input.nativeElement.disabled = false;
			input.nativeElement.classList.remove('disabled');
		});
	}
}
