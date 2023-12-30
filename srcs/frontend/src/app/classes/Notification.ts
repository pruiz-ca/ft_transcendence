export interface INotification {
	action: 'send' | 'accept' | 'decline' | 'remove';
	type: 'friend' | 'challenge';
	receiver?: string;
	request_id?: string;
}