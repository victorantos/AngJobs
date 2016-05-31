import {Component, OnInit } from 'angular2/core';
import {Router, ROUTER_DIRECTIVES} from 'angular2/router';
import {JobPost} from '../core/jobpost';
import {JobsService} from '../jobs/jobs.service';
import {JobItemComponent } from './job-item.component';
import {JobDetail} from './jobdetail'
import {JobFilterPipe} from './job-filter.pipe';
import {SharedService} from '../core/shared.service';
 

@Component({
    selector: 'jobs-list',
    templateUrl: 'app/jobs/jobs-list.component.html',
    styleUrls: ['app/jobs/jobs-list.component.css'],
    directives: [JobItemComponent, ROUTER_DIRECTIVES, JobDetail],
    pipes: [JobFilterPipe],
    providers: [JobsService] 
})
export class JobsListComponent implements OnInit {
    errorMessage: string = '';
    homepageJobs: Array<JobPost>;
    contractFilter: string = "contract";
    permanentFilter: string = "permanent";
    
    constructor(  private _router: Router,private _jobsService: JobsService,
    private _sharedService: SharedService ) {
    }
    ngOnInit() {
        this._jobsService.getHomepageJobs()
            .subscribe(
            jobs => this.homepageJobs = jobs,
            error => this.errorMessage = <any>error);
    }
     
    gotoDetail(job: JobPost) {
        let link = ['JobDetail', {id:job.id}];
        this._sharedService.saveSelectedJob(job);
        this._router.navigate(link);
    }

}