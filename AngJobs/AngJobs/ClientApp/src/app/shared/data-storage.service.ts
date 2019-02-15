import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Job } from '../jobs/job.model';
import 'rxjs/Rx';
import { throwError } from 'rxjs';
import { catchError, retry, map} from 'rxjs/operators';
import { JobsService } from '../services/jobs.service';
import { Resume } from '../jobs/resume.model';
import { JobApplication } from '../jobs/job-application/job-application.model';

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

  storeResumes() {
    return this.httpClient.put('https://angjobsauth.firebaseio.com/resumes.json', this.jobsService.getResumes())
      .pipe(
        catchError((e: any) => this.handleError(e))) 
      .subscribe(data => console.log('saved: ', data));
  }

  storeJobApplications() {
    return this.httpClient.put('https://angjobsauth.firebaseio.com/jobapplications.json', this.jobsService.getJobApplications())
      .pipe(
        catchError((e: any) => this.handleError(e)))
      .subscribe(data => console.log('saved: ', data));
  }

  retreiveResumes() {
    return this.httpClient.get('https://angjobsauth.firebaseio.com/resumes.json')
      .pipe(
        catchError((e: any) => this.handleError(e))
    )
      .subscribe((data: Resume[]) => {
        console.log(data);
        this.jobsService.setResumes(data);
      });
  }

  retreiveJobApplications() {
    return this.httpClient.get('https://angjobsauth.firebaseio.com/jobapplications.json')
      .pipe(
        catchError((e: any) => this.handleError(e))
    )
      .subscribe((data: JobApplication[]) => {
        console.log(data);
        this.jobsService.setJobApplications(data);
      });
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
