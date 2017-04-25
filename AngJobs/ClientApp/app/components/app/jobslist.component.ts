import { Component, Optional } from '@angular/core';
import { Http } from '@angular/http'
import { Job } from '../../model/Job';

@Component({
    selector: 'jobslist',
    templateUrl: './jobslist.component.html'
})
export class JobsListComponent {
    public selectedJob: Job;
    public jobs: Job[];

    constructor(private http: Http) {
        http.get('/api/SampleData/GetJobs').subscribe(result => {
            this.jobs = result.json() as Job[];
        });
    }

    onSelect(job: Job): void {
        this.selectedJob = job;
        console.log("Selected item:", job);
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