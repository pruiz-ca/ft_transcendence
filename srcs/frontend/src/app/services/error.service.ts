import {HttpErrorResponse} from '@angular/common/http';
import {Injectable, NgZone} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';

@Injectable()
export class ErrorService {
	constructor(
		private snackBar: MatSnackBar,
		private zone: NgZone,
		private router: Router,
	) {}

	private _error$: BehaviorSubject<HttpErrorResponse | undefined> =
		new BehaviorSubject<HttpErrorResponse | undefined>(undefined);

	error$: Observable<HttpErrorResponse | undefined> =
		this._error$.asObservable();

	updateError(error: HttpErrorResponse) {
		this._error$.next(error);
	}

	showErrorNotif(error: HttpErrorResponse) {
		const msg = error.error ? error.error.error : error.message;
		this.zone.run(() => {
			const bar = this.snackBar.open(
				"Oopsies, i've had a problem: " + msg,
				'sowy',
				{
					horizontalPosition: 'center',
					verticalPosition: 'top',
					panelClass: ['errorSnackBar'],
					// duration: 2000
				},
			);
			bar.onAction().subscribe(() => {
				bar.dismiss();
			});
			if (error.status != 400 && error.status != 409)
				this.router.navigate(['/']);
		});
	}
}
