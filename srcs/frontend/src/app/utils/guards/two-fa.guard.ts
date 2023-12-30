import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { PongService } from '../../services/pong.service';

@Injectable({
  providedIn: 'root'
})
export class TwoFaGuard implements CanActivate {
  constructor(
    private router: Router,
    private pongService: PongService
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (!this.pongService.user || !this.pongService.getCookie()) {
      this.router.navigate(['/login']);
      return false;
    }
    if (localStorage.getItem('inTwoFa') == 'true' || this.pongService.user?.two_fa) return true;
    this.router.navigate(['/login']);
    return false;
  }
}
