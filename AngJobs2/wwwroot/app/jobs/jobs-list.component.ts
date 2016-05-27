import {Component, OnInit } from 'angular2/core';
import {Router} from 'angular2/router';
import {JobPost} from '../core/jobpost';
import {JobsService} from '../jobs/jobs.service';
import {JobItemComponent } from './job-item.component';
import {JobFilterPipe} from './job-filter.pipe';

@Component({
    selector: 'jobs-list',
    templateUrl: 'app/jobs/jobs-list.component.html',
    directives: [JobItemComponent],
    pipes: [JobFilterPipe],
    providers: [JobsService]
})
export class JobsListComponent implements OnInit {
    errorMessage: string = '';
    homepageJobs: Array<JobPost>;
    contractFilter: string = "contract";
    permanentFilter: string = "permanent";
    
    constructor(private _router: Router, private _jobsService: JobsService) {
    }
    ngOnInit() {
        this._jobsService.getHomepageJobs()
            .subscribe(
            jobs => this.homepageJobs = jobs,
            error => this.errorMessage = <any>error);
    }

}