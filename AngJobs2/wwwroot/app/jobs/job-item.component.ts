import {Component, Input} from 'angular2/core';

@Component({
    selector: 'job-item',
    templateUrl: './app/jobs/job-item.html',
    directives: []
})
export class JobItemComponent implements IJobItem {
    @Input() title: string;
    @Input('job-id') id: number;
}

export interface IJobItem {
    title: string;
    id: number;
}
