import * as ng from '@angular/core';
import { Http } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import {ApplyNow} from './apply-now';

@ng.Component({
    selector: 'job-detail',
    template: require('./job-detail.html'),
    directives: [ApplyNow]
})
export class JobDetail implements ng.OnInit {
    @ng.Input('job-id') jobId: number;
    jobDetail: any;
    private sub: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router, private http: Http) {

    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            let id = +params['id']; // (+) converts string 'id' to a number
            this.jobId = id;

            this.http.get('api/jobsdata/jobdetail/' + this.jobId).subscribe(result => {
                this.jobDetail = result.json();
            });

            //this.service.getJobDetail(id).then(job => this.jobDetail = job);
        });
    }
}
