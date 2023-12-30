import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { PongService } from '../../services/pong.service';

@Injectable({
  providedIn: 'root'
})
export class HomeGuard implements CanActivate {
  constructor(
    private router: Router,
    private pongService: PongService,
) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!this.pongService.user) {
      this.router.navigate(['login']);
      return false;
    }
    if (localStorage.getItem("inTwoFa") == "true") {
      this.router.navigate(['/2fa']);
      return false;
    }
    if (this.pongService.user && this.pongService.getCookie() && this.pongService.socket) return true;
    this.router.navigate(['/login']);
    return false;
  }
}
