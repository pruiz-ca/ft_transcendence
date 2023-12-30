import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeGuard } from './utils/guards/home.guard';
import { LoginGuard } from './utils/guards/login.guard';
import { LoginComponent } from './login/login.component';
import { UserComponent } from './user/user.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { CanvasComponent } from './utils/canvas/canvas.component';
import { GameComponent } from './game/game.component';
import { ErrorComponent } from './utils/error/error.component';
import { TwoFaComponent } from './login/two-fa/two-fa.component';
import { TwoFaGuard } from './utils/guards/two-fa.guard';

const routes: Routes = [
	{ path: 'error', component: ErrorComponent },
	{ path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
	{ path: '2fa', component: TwoFaComponent, canActivate: [TwoFaGuard]},
	{
		path: '',
		component: CanvasComponent,
		canActivate: [HomeGuard],
	},

	{ path: '**', component: ErrorComponent },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}