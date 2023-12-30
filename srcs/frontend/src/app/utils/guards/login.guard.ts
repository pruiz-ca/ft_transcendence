import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { PongService } from '../../services/pong.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(
    private router: Router,
    private pongService: PongService
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (localStorage.getItem("inTwoFa") == "true" && this.pongService.user) {
      this.router.navigate(['/2fa']);
      return false;
    }
    if (!this.pongService.user || !this.pongService.getCookie()) return true;
    this.router.navigate(['/']);
    return false;
  }
}
