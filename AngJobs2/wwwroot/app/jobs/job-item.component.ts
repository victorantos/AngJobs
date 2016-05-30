import {Component, Input} from 'angular2/core';
import {JobDetail} from './jobdetail';
import {JobPost} from '../core/jobpost'

@Component({
    selector: 'job-item',
    templateUrl: './app/jobs/job-item.component.html',
    styleUrls: ['./app/jobs/job-item.component.css'],
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
