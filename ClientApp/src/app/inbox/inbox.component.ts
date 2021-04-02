import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { WhoPostUser } from '../models/WhoPostUser';
import { HnjobsService } from "../services/hnjobs.service";
import { LoggingService } from '../services/logging.service';
import { last, map } from "rxjs/operators";
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
  lastStoryComments!: Observable<Observable<WhoPostComment>[]>;

  constructor(private hnjobs: HnjobsService,
    private logService: LoggingService,
    private route: ActivatedRoute) {
       
  } 
  ngOnInit() {
    this.lastId = this.hnjobs.getLastWhoPostStoryId();
     
    this.lastStory = this.hnjobs.getLastWhoPostStory();
 
    // Subscribe to the single observable, giving us both
    this.route.params.subscribe(routeParams => {
      // routeParams containing both the query and route params
        this.loadInbox(routeParams.page);
    });
  }
 
  loadInbox(currentPage: any): void {
    this.page = currentPage;
 
    if (currentPage)
      this.page = +currentPage;
    
    this.lastStoryComments = this.hnjobs.getLastWhoPostComments(this.page);
  
 
    console.log('loadInbox: ', currentPage);
  }

}
