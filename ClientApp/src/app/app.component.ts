import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { WhoPostUser } from './models/whopostuser';
import { HnjobsService } from "./services/hnjobs.service";
import { LoggingService } from './services/logging.service';
import { map } from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit  {
  
  title = 'ClientApp';
  whoishiring!: Observable<string[]>;
  lastId!: Observable<string>;

  constructor(private hnjobs: HnjobsService, private logService: LoggingService) {
    
  }
  ngOnInit() {
    this.lastId = this.hnjobs.getLastWhoPostId();
    // this.whoishiring = this.hnjobs.getWhoPostUser().pipe(map(responseData => {
    //   const submittedArray = [];
    //   const key = "submitted";
     
    //    if (Object.prototype.hasOwnProperty.call(responseData, key)) {
    //      const items = (responseData)[key];
    //     for (const k in items) {
    //       if (Object.prototype.hasOwnProperty.call(items, k)) {
    //         const element = items[k];
    //         submittedArray.push(element);
    //       }
    //     }
       
    //    }
    //    return submittedArray;
    // }));
    this.logService.log("getWhoPost has been called, whoishiring has been populated");
  }
 
   
}
