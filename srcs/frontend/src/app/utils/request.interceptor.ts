import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service'
import { Router } from '@angular/router';
import { ErrorService } from '../services/error.service';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {

  constructor(private cookies: CookieService, private router: Router, private errorService: ErrorService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let headers;
    const token = this.cookies.get("access_token");
    if (!token) headers = req;
    else headers = req.clone({ withCredentials: true });
    return next.handle(headers).pipe(
      catchError(error => {
        if (error.status == 401)
        {
          this.cookies.delete("access_token");
          localStorage.removeItem("user");
          this.router.navigate(['/login']).then(() => {
            window.location.reload();
          });
        }
        return throwError(() => new HttpErrorResponse(error));
      })
    );
  }
}
