import * as ng from '@angular/core';
import { Http } from '@angular/http';
import {ROUTER_DIRECTIVES} from '@angular/router';

@ng.Component({
    selector: 'jobs-list',
    template: require('./jobs-list.html'),
    directives: [ROUTER_DIRECTIVES]
})
export class JobsList {
    public hotJobs: HotJob[];

    constructor(http: Http) {
        http.get('api/jobsdata/hotjobs').subscribe(result => {
            this.hotJobs = result.json();
        });
    }
}


interface HotJob {
    jobId: number;
    jobTitle: string;
    summary: string;
}
