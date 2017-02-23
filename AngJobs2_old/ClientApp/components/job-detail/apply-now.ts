import * as ng from "@angular/core";
import {Http, RequestOptions, Headers, Response} from "@angular/http";
import { Observable } from 'rxjs/Observable';
import {Router} from "@angular/router";

// Statics
import 'rxjs/add/observable/throw';

// Operators
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';

@ng.Component(
    {
        selector: "apply-now",
        template: require('./apply-now.html')
    })
export class ApplyNow {
    @ng.Input() isApplying: boolean;
    @ng.Input() jobId: number;
    @ng.Output() isApplyingChange = new ng.EventEmitter();
    @ng.Output() canceledChange = new ng.EventEmitter();;

    applied: boolean;
    canceled: boolean;
    jobapplicationMsg: string;
    errorMsg: any;
    applications: any;

    constructor(private http: Http, private router: Router) {
        this.applied = false;
        this.canceled = false;
       
    }

    private handleError(error: any) {
        // In a real world app, we might use a remote logging infrastructure
        // We'd also dig deeper into the error to get a better message
        let errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.error(errMsg); // log to console instead
        return Observable.throw(errMsg);
    }

    private extractData(res: Response) {
        let body = res.json();
        return body.data || {};
    }

    applyForJob() {
        // this.isApplyingChange.emit(false);
        let application = { jobId: this.jobId, applicationMessage: this.jobapplicationMsg };
        let body = JSON.stringify(application);
        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers });

        return this.http.post("/api/jobsdata/applyforjob", body, options)
            .subscribe(application => {
                console.log(this.applied);
                this.applied = true;
            }
            ,
            error => this.errorMsg = <any>error);
    }

    gotBackToJobs() {
        this.router.navigate(['/home']);
    }
    cancel()
    {
        this.isApplyingChange.emit(false);
        this.canceledChange.emit(true);
    }
}