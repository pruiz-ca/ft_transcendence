import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ErrorService } from 'app/services/error.service';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent implements OnInit {

  errorNum: number = 404;
  constructor(private errorService: ErrorService) {
    this.errorService.error$.subscribe((error: HttpErrorResponse | undefined) => {
      if (error?.status)
        this.errorNum = error?.status;
      else if (error?.statusText == "Unknown Error") {
        this.errorNum = 502;
      }
    });
  }

  ngOnInit(): void {}

  back() {
    window.history.back();
  }
}
