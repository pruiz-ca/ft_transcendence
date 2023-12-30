import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-searchbar',
  templateUrl: './searchbar.component.html',
  styleUrls: []
})
export class SearchbarComponent {

  @ViewChild('searchbar') searchbar!: ElementRef;
  @Input() placeholder: string = "";

  initVal: string = "";
  inputVal = new BehaviorSubject<string>('');
  trigger = this.inputVal.pipe(
    debounceTime(300),
    distinctUntilChanged()
  )
  
  constructor() {}

  onInput(e: any) {
    this.inputVal.next(e.target.value);
  }

}
