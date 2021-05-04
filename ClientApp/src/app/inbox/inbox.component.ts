import { Component, OnInit } from '@angular/core';
import { Observable, concat } from 'rxjs';
import { last, map, concatMap, delay } from "rxjs/operators";
import { of, from } from "rxjs";
import { WhoPostUser } from '../models/WhoPostUser';
import { HnjobsService } from "../services/hnjobs.service";
import { LoggingService } from '../services/logging.service';

import { WhoPostStory } from '../models/WhoPostStory';
import { WhoPostComment } from '../models/WhoPostComment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss']
})
export class InboxComponent implements OnInit {
  page: number = 0;
  lastId!: Observable<string>;
  lastStory!: Observable<WhoPostStory>;
  lastStoryComments: WhoPostComment[] = [];

  constructor(private hnjobs: HnjobsService,
    private logService: LoggingService,
    private route: ActivatedRoute) {

  }
  ngOnInit() {
    this.lastId = this.hnjobs.getLastWhoPostStoryId();

    this.lastStory = this.hnjobs.getLastWhoPostStory();
     
    this.route.params.subscribe(routeParams => {
      this.loadInbox(routeParams.page);
    });
  }

  onNewSearchTerm(term: string): void {
    this.lastStoryComments = [];
    this.loadInbox(1, term);
    console.log('searching...', term);
  }

  loadInbox(currentPage: any, searchTerm:string = ''): void {
    this.page = currentPage;
    let self = this;
    if (currentPage)
      this.page = +currentPage;

    this.lastStoryComments = [];
    const listOfReqs = this.hnjobs.getWhoPostCommentsForSearch(this.page);
    listOfReqs.subscribe(list => {
      console.log('list is ', list);


      const obsConstr = from(list).pipe(
        concatMap(i => {
          i.subscribe();
          return i.pipe(delay(10));
        })
      );

      obsConstr.subscribe(
        {
          next: (v) => {
            if (searchTerm == '' || v.text.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0)
              self.lastStoryComments.push(v);
          }
        });
    });

  }
}
