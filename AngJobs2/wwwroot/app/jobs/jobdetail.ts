import {Component} from 'angular2/core';
import {JobPost} from '../core/jobpost';
import {JobsService} from '../jobs/jobs.service';
import {RouteParams, Router} from 'angular2/router';
import {SharedService} from '../core/shared.service';
import {JobApplyComponent} from './job-apply.component';

@Component({
    selector:"job-detail",
    templateUrl: './app/jobs/jobdetail.html',
    directives: [JobApplyComponent],
    inputs: ['jobpost'], 
    providers: [JobsService]
})
export class JobDetail {
    public jobpost: JobPost;
    public applying: boolean = false; //applying for a job
    public applied: boolean = false; //already applied for a job
     
    public showHideApplicationForm() : void{
        
        this.applying = !this.applying;
    } 
    
    public showJobAppliedStatus(): void{
        this.applying = false;
        this.applied = true;
    }
    
    constructor(private _jobsService: JobsService,
        private _routeParams: RouteParams, private _router: Router,
        private _sharedService: SharedService) {
        let id = +this._routeParams.get('id');
        // _jobsService.getJobDetail(id)
        //     .subscribe(res => this.jobPost = res);
          
        this.jobpost = _sharedService.getSelectedJob();
    } 
}
