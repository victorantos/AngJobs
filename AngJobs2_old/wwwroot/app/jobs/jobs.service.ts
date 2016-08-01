import {Http, Response} from 'angular2/http';
import {Injectable} from 'angular2/core';
import {JobPost} from '../core/jobpost';
import {Observable} from 'rxjs/Observable';
 

import 'rxjs/Rx';
/**
 * jobs service
 */
@Injectable()
export class JobsService {
    private _contractsUrl = 'api/contracts.json';

    jobPosts: JobPost[] = [];
    //   person: Person = null;

    constructor(private _http: Http) { }

    getJobs() {
        //return an observable
        return this._http.get('/api/jobs')
            .map((response) => {
                return response.json();
            });
    }

    getHomepageJobs(): Observable<JobPost[]> {
        return this._http.get(this._contractsUrl)
            .map((response: Response) => <JobPost[]>response.json())
            .do(data => console.log("All: " + JSON.stringify(data)))
            .catch(this.handleError);
    }

    getJobDetail(id: number) {
        return this._http.get('/api/jobs/' + id.toString())
            .map((response) => {
                return response.json();
            });
    }

    private handleError(error: Response) {
        // in a real world app, we may send the server to some remote logging infrastructure
        // instead of just logging it to the console
        console.error(error);
        return Observable.throw(error.json().error || 'Server error');
    }
    //private _fetchFailed(error: any) {
    //    console.error(error);
    //    return Promise.reject(error);
    //}
}