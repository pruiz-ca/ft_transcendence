import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {User} from 'app/classes/User';
import {PongService} from '../services/pong.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: [],
})
export class LoginComponent implements OnInit {
	user!: User;
	isNew!: boolean;

	constructor(
		private pongService: PongService,
		private route: ActivatedRoute,
		private router: Router,
	) {}

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			this.handleSuccess(params);
		});
	}

  handleSuccess(params: any) {
    if (params['success']) {
        this.pongService.saveCookie(params['success']);
        this.pongService.storeLoggedUser().subscribe((user) => {
          this.user = user;
          if (user.two_fa) {
            this.router.navigate(['2fa']);
          }
		  else {
			if (params['new']) {
				this.isNew = true;
				this.router.navigate(['/login']);
			} else
		  		this.router.navigate(['/']);
		  }
        });
      }
  }

	login() {
		this.pongService.login();
	}

	updateUser(newUser: User) {
		this.user = newUser;
		this.router.navigate(['user/' + this.user.user_id], {replaceUrl: true});
	}

	redirect() {
		this.isNew = false;
		this.router.navigate(['/']);
	}
}
