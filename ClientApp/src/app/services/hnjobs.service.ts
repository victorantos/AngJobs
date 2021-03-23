import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import { WhoPostUser } from "../models/whopostuser";
import { environment } from "../../environments/environment";
import { WhoPost } from '../models/whopost';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HnjobsService {
  private whoishiring = environment.whoishiringuserUrl;
  
  constructor(private http: HttpClient) {

  }
  // TODO use caching for this method
  getWhoPostUser(): Observable<string[]> {
   
    return this.http.get(this.whoishiring).pipe(map(responseData => {
      const submittedArray = [];
      const key = "submitted";
     
      if (Object.prototype.hasOwnProperty.call(responseData, key)) {
        const items = (responseData as WhoPostUser)[key];
        for (const k in items) {
          if (Object.prototype.hasOwnProperty.call(items, k)) {
            const element = items[k];
            submittedArray.push(element);
          }
        }
       
      }
      return submittedArray;
    }));
  }
  getLastWhoPostId(): any {
    let response = this.getWhoPostUser().pipe(map(responseData => {
      return responseData[0];
    }));
    console.log(response);
    return response;
  }

  getLastWhoPost(): Observable<WhoPostJob[]>
  {
    let response = this.getLastWhoPostId().pipe
  }
}
