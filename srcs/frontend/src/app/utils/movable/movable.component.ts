import {
	AfterViewInit,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnInit,
	Output,
} from '@angular/core';

@Component({
	selector: 'app-movable',
	templateUrl: './movable.component.html',
	styleUrls: [],
})
export class MovableComponent implements OnInit, AfterViewInit {
	@Input() icon!: string;
	@Input() id!: string;
	@Input() name!: string;
	@Input() color!: string;
	@Output() event = new EventEmitter<string>();

	ngAfterViewInit(): void {
		const doc = document.getElementById('button_' + this.id);
		if (
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent,
			)
		) {
			doc?.removeEventListener('dblclick', this.fireEvent.bind(this));
			doc?.addEventListener('click', this.fireEvent.bind(this));
		} else {
			doc?.addEventListener('dblclick', this.fireEvent.bind(this));
			doc?.removeEventListener('click', this.fireEvent.bind(this));
		}
	}

	ngOnInit(): void {}

	fireEvent() {
		this.event.emit(this.id);
	}
}
