import * as ng from '@angular/core';
import { Http } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';

import {ApplyNow} from './apply-now';
import { Helpers} from '../../services/helpers';
import {DynamicPaddingDirective} from '../../directives/dynamic-padding';

@ng.Component({
    selector: 'job-detail',
    template: require('./job-detail.html'),
    directives: [ApplyNow, DynamicPaddingDirective]
})
export class JobDetail implements ng.OnInit {
    @ng.Input() jobId: number;
    jobDetail: any;
    topPadding: number;

    private sub: any;

    constructor(private route: ActivatedRoute, private router: Router, private http: Http, private helpers: Helpers) {
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            let id = +params['id']; // (+) converts string 'id' to a number
            this.jobId = id;

            this.http.get('api/jobsdata/jobdetail/' + this.jobId).subscribe(result => {
                this.jobDetail = result.json();

                let that = this;
                setTimeout(function () {
                    that.topPadding = that.helpers.ClientClickCoordinateY;
                }, 0);

            });

            //this.service.getJobDetail(id).then(job => this.jobDetail = job);
        });
    }
}
