import {Component, HostListener, OnDestroy} from '@angular/core';
import Swal from 'sweetalert2';
import {PongService} from './services/pong.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: [],
})
export class AppComponent implements OnDestroy {
	title = 'pong';
	constructor(public pongService: PongService) {}

	ngOnDestroy(): void {
		this.pongService.logout();
	}

	displayRightClickMenu(e: any) {}

	@HostListener('window:popstate', ['$event'])
	onPopState() {
		Swal.close();
	}
}
