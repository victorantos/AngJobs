import {Component, Input} from 'angular2/core';

@Component({
    selector: 'job-item',
    templateUrl: './app/jobs/job-item.component.html',
    directives: []
})
export class JobItemComponent implements IJobItem {
    @Input() title: string;
    @Input() description: string;
    @Input('job-id') id: number;
}

export interface IJobItem {
    title: string;
    id: number;
}
