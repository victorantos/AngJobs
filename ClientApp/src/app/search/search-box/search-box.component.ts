import { Component, OnInit } from '@angular/core';
import { HnjobsService } from '../../services/hnjobs.service';
import { Observable, combineLatest } from "rxjs";
import { filter } from 'rxjs/operators'
import { WhoPostComment } from '../../models/WhoPostComment';

@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
})
export class SearchBoxComponent implements OnInit {

  constructor(private hnService: HnjobsService) { }

  getFilteredWhoPostComments(keyword: Observable<string>, page: number = 1, pageSize: number = 10): Observable<Observable<WhoPostComment>[]> {

    if (keyword) {
    //  keyword = keyword.trim();
    }
    else return this.hnService.getLastWhoPostComments(page, pageSize);

    let filteredResults = this.hnService.getLastWhoPostComments(page, pageSize).pipe(
     // combineLatest()
    );
    return filteredResults;
  }

  ngOnInit(): void {
  }

}
