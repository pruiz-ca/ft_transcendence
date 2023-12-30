import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { User } from 'app/classes/User';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: []
})
export class MessageComponent implements OnInit {

  constructor() { }

  @Input() user!: User;
  @Input() message!: { text: string, fromId: string, fromUsername: string };
  @Input() isPersonal!: boolean;

  myMessage = false;
  @ViewChild('wrapper') wrapper!: ElementRef;
  @ViewChild('messageWrapper') messageWrapper!: ElementRef;

  ngOnInit(): void {
    if (this.user.user_id == this.message.fromId)
      this.myMessage = true;
    }
    
    ngAfterViewInit() {
      this.modMessageStyle(this.myMessage);
    }

  modMessageStyle(bool: boolean) {
    if (bool) {
      this.wrapper.nativeElement.style.alignItems = 'flex-end';
      this.messageWrapper.nativeElement.style.alignItems = 'flex-end';
    } else {
      this.wrapper.nativeElement.style.alignItems = 'flex-start';
      this.messageWrapper.nativeElement.style.alignItems = 'flex-start';
    }
  }

  showSender() {
    if (this.myMessage || this.isPersonal)
      return false;
    return true;
  }
}
