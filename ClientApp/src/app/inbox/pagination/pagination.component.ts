import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnInit {
  @Input('page') page: number = 0;
  readonly pagerSizeMax = 5;
  readonly pagerSizeMaxArray = new Array(this.pagerSizeMax).fill(0);
  readonly pagerSize: Array<number>= new Array(this.pagerSizeMax).fill(0);
  readonly firstHalf: Array<number>;
  readonly secondHalf: Array<number>;
  

  constructor() {
      
    const half = Math.floor(this.pagerSize.length / 2);

    this.firstHalf = this.pagerSize.splice(0, half);

    this.secondHalf = this.pagerSize.splice(- half);
  }

  ngOnInit(): void {


    console.log('PaginationComponent, page is:', this.page);
    console.log('PaginationComponent, pagerSize is:', this.pagerSize);
  }

  getPageItemNumber(index: number): any {

    const p = this.page + index - ~~(this.pagerSize.length / 2);
    if (p < 1)
      return 1;

    return p;
  }
}
