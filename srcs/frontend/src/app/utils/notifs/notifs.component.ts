import {
	Component,
	Input,
	OnDestroy,
	OnInit,
	Output,
	EventEmitter,
} from '@angular/core';
import {UserService} from 'app/services/user.service';
import {IRelationRequest, RelationType, RelationStatus} from 'app/classes/User';

@Component({
	selector: 'app-notifs',
	templateUrl: './notifs.component.html',
	styleUrls: [],
})
export class NotifsComponent implements OnInit, OnDestroy {
	@Input() request!: IRelationRequest;
	@Output() close = new EventEmitter();
	description = '';
	type!: 'friend' | 'challenge';

	constructor(private readonly userService: UserService) {}

	ngOnDestroy(): void {
		this.close.emit();
	}

	ngOnInit(): void {
		this.description =
			this.request.relation_type == RelationType.FRIEND
				? 'friend request'
				: 'game challenge';
		this.type =
			this.request.relation_type == RelationType.FRIEND
				? 'friend'
				: 'challenge';
	}

	acceptRequest() {
		this.userService.respondRequest(
			RelationStatus.ACCEPTED,
			this.request.relation_id,
			this.type,
		);
	}

	declineRequest() {
		this.userService.respondRequest(
			RelationStatus.DECLINED,
			this.request.relation_id,
			this.type,
		);
	}
}
