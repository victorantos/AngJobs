import {Http} from 'angular2/http';
import {Injectable} from 'angular2/core';
import {JobPost} from '../core/jobpost';
import {Observable} from 'rxjs/Observable';
import {IJobItem} from './jobitem';

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

    getProducts(): Observable<IJobItem[]> {
        return this._http.get(this._contractsUrl)
            .map((response: Response) => <IProduct[]>response.json())
            .do(data => console.log("All: " + JSON.stringify(data)))
            .catch(this.handleError);
    }

    getJobDetail(id: number) {
        return this._http.get('/api/jobs/' + id.toString())
            .map((response) => {
                return response.json();
            });
    }

    //private _fetchFailed(error: any) {
    //    console.error(error);
    //    return Promise.reject(error);
    //}
}