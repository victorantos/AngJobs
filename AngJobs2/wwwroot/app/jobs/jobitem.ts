import {Component, Input} from 'angular2/core';

@Component({
    selector: 'job-item',
    templateUrl: './app/jobs/jobitem.html',
    directives: []
})
export class JobItem implements IJobItem {
    @Input() title: string;
    @Input('job-id') id: number;
}

export interface IJobItem {
    title: string;
    id: number;
}
