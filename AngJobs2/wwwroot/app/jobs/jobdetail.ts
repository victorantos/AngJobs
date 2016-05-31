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
    providers: [JobsService]
})
export class JobDetail {
    public jobpost: JobPost;
     
    constructor(private _jobsService: JobsService,
        private _routeParams: RouteParams, private _router: Router,
        private _sharedService: SharedService) {
        let id = +this._routeParams.get('id');
        // _jobsService.getJobDetail(id)
        //     .subscribe(res => this.jobPost = res);
          
        this.jobpost = _sharedService.getSelectedJob();
    } 
}
