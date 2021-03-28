import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { WhoPostUser } from './models/WhoPostUser';
import { HnjobsService } from "./services/hnjobs.service";
import { LoggingService } from './services/logging.service';
import { last, map } from "rxjs/operators";
import { WhoPostStory } from './models/WhoPostStory';
import { WhoPostComment } from './models/WhoPostComment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit  {
  
  title = 'ClientApp';

  lastId!: Observable<string>;
  lastStory!: Observable<WhoPostStory>; 
  lastStoryComments!: Observable<Observable<WhoPostComment>[]>;
  constructor(private hnjobs: HnjobsService, private logService: LoggingService) {
    
  } 
  ngOnInit() {
    this.lastId = this.hnjobs.getLastWhoPostStoryId();
     
    this.lastStory = this.hnjobs.getLastWhoPostStory();
    this.lastStoryComments = this.hnjobs.getLastWhoPostComments();
   
    this.logService.log("getWhoPost has been called, whoishiring has been populated");
  }
 
 
}
