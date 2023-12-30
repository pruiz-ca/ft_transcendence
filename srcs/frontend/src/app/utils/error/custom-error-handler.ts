import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ErrorService } from 'app/services/error.service';

@Injectable()
export class CustomErrorHandler implements ErrorHandler {
  
  constructor(private errorService: ErrorService, private router: Router, private location: Location) {}

  handleError(error: HttpErrorResponse) {
    if (error instanceof HttpErrorResponse && error.statusText == "Unknown Error") {
      this.errorService.updateError(error);
      this.router.navigate(['error']).then();
    } else if (error instanceof HttpErrorResponse) {
      this.location.replaceState("/");
      this.errorService.showErrorNotif(error);
    }
  }
}