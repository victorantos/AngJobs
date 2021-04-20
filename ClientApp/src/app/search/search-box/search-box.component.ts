import { Component, OnInit } from '@angular/core';
import { HnjobsService } from '../../services/hnjobs.service';
import { Observable, combineLatest } from "rxjs";
import { filter, switchMapTo, tap } from 'rxjs/operators'
import { WhoPostComment } from '../../models/WhoPostComment';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
})
export class SearchBoxComponent implements OnInit {
  keyword = new FormControl('');
  keyword$ = this.keyword.valueChanges;

  constructor(private hnService: HnjobsService) { }

  getFilteredWhoPostComments(page: number = 1, pageSize: number = 10): Observable<Observable<WhoPostComment>[]> {

    
    return this.hnService.getLastWhoPostComments(page, pageSize);

    let pageList$ = this.hnService.getLastWhoPostComments(page, pageSize);
 
    return null;
  }

  ngOnInit(): void {

    this.onChanges();
   
  }

  onChanges(): void{

    
    //this.keyword$.pipe(tap(v => console.log('este: ', v)));
    this.keyword$.subscribe();
  }

}
