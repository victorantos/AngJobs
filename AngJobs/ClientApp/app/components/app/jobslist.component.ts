import { Component, Optional, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { JobDetail } from '../../model/JobDetail';

@Component({
    selector: 'jobslist',
    templateUrl: './jobslist.component.html'
})
export class JobsListComponent implements OnInit {
    public selectedJob: JobDetail;
    public jobs: JobDetail[];

    constructor(private sharedService: SharedService) {
        console.log("jobs constructor");
    }

    onSelect(job: JobDetail): void {
        this.selectedJob = job;
        console.log("Selected item:", job);
    }
    getJobs(): void {
        this.sharedService.GetJobs().then(result =>  
             this.jobs = result
        );
    }

    ngOnInit(): void{
        this.getJobs();
    }

    notes = [
        {
            name: 'Vacation Itinerary',
            updated: new Date('2/20/16'),
        },
        {
            name: 'Kitchen Remodel',
            updated: new Date('1/18/16'),
        }
    ];

}