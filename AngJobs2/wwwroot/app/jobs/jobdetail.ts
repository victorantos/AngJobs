import {Component} from 'angular2/core';
import {JobPost} from '../core/jobpost';
import {JobsService} from '../jobs/jobs.service';
import {RouteParams, Router} from 'angular2/router';
import {SharedService} from '../core/shared.service';

@Component({
    selector:"job-detail",
    templateUrl: './app/jobs/jobdetail.html',
    directives: [],
    inputs: ['jobpost'], 
    providers: [JobsService, SharedService]
})
export class JobDetail {
    public jobPost: JobPost;
     
    constructor(private _jobsService: JobsService,
        private _routeParams: RouteParams, private _router: Router,
        private _sharedService: SharedService) {
        let id = +this._routeParams.get('id');
        // _jobsService.getJobDetail(id)
        //     .subscribe(res => this.jobPost = res);
          
        this.jobPost = _sharedService.getSelectedJob();
        console.log("shared job post", this.jobPost);
    } 
}
