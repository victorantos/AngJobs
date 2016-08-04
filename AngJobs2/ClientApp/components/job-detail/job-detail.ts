import * as ng from '@angular/core';
import { Http } from '@angular/http';

@ng.Component({
    selector: 'job-detail',
    template: require('./job-detail.html')
})
export class JobDetail {
    jobDetail: any;

    constructor(http: Http) {
        //http.get('api/jobsdata/detail').subscribe(result => {
        //    this.jobDetail = result.json();
        //});

        
    }
}
