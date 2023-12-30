import {ErrorHandler, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CookieService} from 'ngx-cookie-service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MatMenuModule} from '@angular/material/menu';
import {LayoutModule} from '@angular/cdk/layout';

import {SocketIoModule, SocketIoConfig} from 'ngx-socket-io';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {RequestInterceptor} from './utils/request.interceptor';
import {ChatModule} from './chat/chat.module';
import {UserComponent} from './user/user.component';
import {AdminPanelComponent} from './admin-panel/admin-panel.component';
import {CanvasComponent} from './utils/canvas/canvas.component';
import {NotifsComponent} from './utils/notifs/notifs.component';
import {GameComponent} from './game/game.component';
import {GameCardComponent} from './game/game-card/game-card.component';
import {ErrorComponent} from './utils/error/error.component';
import {ErrorService} from './services/error.service';
import {CustomErrorHandler} from './utils/error/custom-error-handler';
import {TwoFaComponent} from './login/two-fa/two-fa.component';
import {MovableComponent} from './utils/movable/movable.component';
import {MeComponent} from './utils/me/me.component';
import {WindowComponent} from './utils/window/window.component';
import {UserCardComponent} from './user/user-card/user-card.component';
import {PongComponent} from './game/pong/pong.component';
import {CustomizeComponent} from './game/customize/customize.component';

const config: SocketIoConfig = {url: 'http://localhost:3000', options: {}};

@NgModule({
	declarations: [
		AppComponent,
		LoginComponent,
		ErrorComponent,
		UserComponent,
		AdminPanelComponent,
		CanvasComponent,
		NotifsComponent,
		GameComponent,
		GameCardComponent,
		ErrorComponent,
		TwoFaComponent,
		MovableComponent,
		MeComponent,
		WindowComponent,
		UserCardComponent,
		PongComponent,
		CustomizeComponent,
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		HttpClientModule,
		ChatModule,
		FormsModule,
		ReactiveFormsModule,
		BrowserAnimationsModule,
		MatSidenavModule,
		MatToolbarModule,
		MatTooltipModule,
		SocketIoModule.forRoot(config),
		MatGridListModule,
		MatIconModule,
		MatSlideToggleModule,
		MatTabsModule,
		MatSnackBarModule,
		DragDropModule,
		MatMenuModule,
		LayoutModule,
	],
	providers: [
		CookieService,
		{provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true},
		ErrorService,
		{provide: ErrorHandler, useClass: CustomErrorHandler},
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
