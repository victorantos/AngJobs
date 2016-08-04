import * as ng from '@angular/core';
import { Http } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';

@ng.Component({
    selector: 'job-detail',
    template: require('./job-detail.html')
})
export class JobDetail implements ng.OnInit {
    @ng.Input('job-id') jobId: number;
    jobDetail: any;
    private sub: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router) {
        //http.get('api/jobsdata/detail').subscribe(result => {
        //    this.jobDetail = result.json();
        //});
    }

    ngOnInit()
    {
        this.sub = this.route.params.subscribe(params => {
            let id = +params['id']; // (+) converts string 'id' to a number
            this.jobId = id;
            //this.service.getJobDetail(id).then(job => this.jobDetail = job);
        });
    }
}
