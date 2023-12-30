import { AfterViewInit, Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { SearchbarComponent } from './searchbar/searchbar.component';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: []
})
export class SearchComponent implements OnInit, AfterViewInit {

  @ViewChild(SearchbarComponent) searchbar!: SearchbarComponent;

  @Input() items$!: Observable<any[]>;
  @Input() foo!: (item: any, text: string) => boolean;
  @Input() template!: TemplateRef<any>;

  allItems: any[] = [];
  searchItems: any[] = [];

  itemsPerPage: number = 10;
  allPages: number = 0;

  constructor() {}

  ngOnInit(): void {
    this.items$.subscribe(items => {
      this.allItems = items;
    });
  }
  
  ngAfterViewInit(): void {
    this.searchbar.trigger.subscribe(text => this.onTextChange(text));
  }

  onTextChange(text: string) {
    this.searchItems = [];
    if (text.length == 0) {
      this.searchItems = this.allItems;
      return ;
    }
    this.allItems.forEach(item => {
      if (this.foo(item, text))
        this.searchItems.push(item);
    });
  }

}
