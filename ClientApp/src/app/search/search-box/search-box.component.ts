import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { HnjobsService } from '../../services/hnjobs.service';
import { Observable, combineLatest, of } from "rxjs";


import { filter, switchMapTo, tap, switchMap, mergeMap, map, mapTo, pluck } from 'rxjs/operators'
import { WhoPostComment } from '../../models/WhoPostComment';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
})
export class SearchBoxComponent implements OnInit {
  @Output() searchTermChanged = new EventEmitter<string>();
  keyword = new FormControl('');
  keyword$ = this.keyword.valueChanges;
  filteredResults$: any;

  constructor(private hnService: HnjobsService) { }

  ngOnInit(): void {

    this.onChanges();

  }

  onChanges(): void {
    this.keyword$.subscribe(val => {
      this.searchTermChanged.emit(val);
    });
  }
   
}
