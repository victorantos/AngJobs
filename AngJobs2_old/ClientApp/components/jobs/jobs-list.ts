import * as ng from '@angular/core';
import { Http } from '@angular/http';
import {ROUTER_DIRECTIVES} from '@angular/router';
import {Helpers} from "../../services/helpers";

@ng.Component({
    selector: 'jobs-list',
    template: require('./jobs-list.html'),
    directives: [ROUTER_DIRECTIVES]
})
export class JobsList {
    public hotJobs: HotJob[];

    helpers: Helpers;

    constructor(http: Http, helpers: Helpers) {
        this.helpers = helpers;

        http.get('api/jobsdata/hotjobs').subscribe(result => {
            this.hotJobs = result.json();
        });
    }

    getCoordinates(event)
    {
        this.helpers.ClientClickCoordinateY = event.y
    }
}


interface HotJob {
    jobId: number;
    jobTitle: string;
    summary: string;
}
