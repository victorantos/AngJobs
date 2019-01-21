import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Job } from '../jobs/job.model';
import 'rxjs/Rx';
import { throwError } from 'rxjs';
import { catchError, retry, map} from 'rxjs/operators';
import { JobsService } from '../services/jobs.service';

@Injectable()
export class DataStorageService{

  constructor(private httpClient: HttpClient, private jobsService: JobsService) {

  }

  retreiveJobPosts() {
    return this.httpClient.get('https://angjobsauth.firebaseio.com/jobposts.json')
      .pipe(
        catchError((e: any) => this.handleError(e))
      )
      .subscribe((data: Job[]) => {
        console.log(data);
        this.jobsService.setJobPosts(data);
      });
  }

  storeJobPost() {
    return this.httpClient.put('https://angjobsauth.firebaseio.com/jobposts.json', this.jobsService.getJobs())
      .pipe(
      catchError((e: any) => this.handleError(e)))
      .subscribe(data => console.log('saved: ', data));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
  };
}
