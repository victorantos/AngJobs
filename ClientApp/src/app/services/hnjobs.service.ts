import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { combineLatest, forkJoin, merge, Observable, of, zip } from 'rxjs';
import { delay } from 'rxjs/operators';
import { WhoPostUser } from "../models/WhoPostUser";
import { environment } from "../../environments/environment";
import { WhoPostStory } from '../models/WhoPostStory';
import { combineAll, concatMap, concatMapTo, map, mapTo, mergeAll, mergeMap, mergeMapTo, switchMap, take, tap } from 'rxjs/operators';
import { WhoPostComment } from '../models/WhoPostComment';

@Injectable({
  providedIn: 'root'
})
export class HnjobsService {
  private whoishiring = environment.whoishiringuserUrl;
  private whoishiringitemUrl = environment.whoishiringitemUrl;

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
  getLastWhoPostStoryId(): any {
    let response = this.getWhoPostUser().pipe(map(responseData => {
      return responseData[0];
    }));
    console.log(response);
    return response;
  }

  getLastWhoPostStory(): Observable<WhoPostStory> {
    return this.getLastWhoPostStoryId().pipe(map(id => {
      console.log("id is", id);
      return id;
    }),
      concatMap(id => { 
        return this.http.get<WhoPostStory>(this.whoishiringitemUrl.replace('{id}', id as string)).pipe(
          map(responseData => {
            console.log('url:', this.whoishiringitemUrl.replace('{id}', id as string));
            console.log("response data", responseData);
            return responseData;
          })
        )


      }));
  }

  getLastWhoPostComments(): Observable<Observable<WhoPostComment>[]> {
    const myReqs: Observable<WhoPostComment>[]=[];
    const mainObs$ = this.getLastWhoPostStory().pipe(
      map((story: WhoPostStory) => {
        const ids = (story as WhoPostStory).kids.splice(1, 5);
       
        let index = 1;
        for (const key in ids) {
          if (Object.prototype.hasOwnProperty.call(ids, key)) {
            const element = ids[key];
            let obs$ = this.http.get<WhoPostComment>(this.whoishiringitemUrl.replace('{id}', element)).pipe(
              delay(index * 1000)
            );
            myReqs.push(obs$);
            index++;
          }
        }
        console.log('myreq:', myReqs);
        return myReqs;
      })
      
    );
 
    return mainObs$;
  }
}
