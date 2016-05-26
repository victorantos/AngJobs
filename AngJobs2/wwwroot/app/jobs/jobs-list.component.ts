import {Component, OnInit } from 'angular2/core';
import {Router} from 'angular2/router';
import {JobPost} from '../core/jobpost';
import {JobsService} from '../jobs/jobs.service';
import { JobItemComponent } from './job-item.component';

@Component({
    selector:'jobs-list',
    templateUrl:'app/jobs/jobs-list.component.html',
    directives:[JobItemComponent],
    providers:[JobsService]
}) 
export class JobsListComponent implements OnInit {
     errorMessage: string = '';
    contracts: Array<JobPost>;
 constructor(private _router: Router, private _jobsService: JobsService) {
    }
     ngOnInit() {     
        console.log("load contracts: " + this.contracts);
        this._jobsService.getProducts()
            .subscribe( 
            contracts => this.contracts = contracts,
            error => this.errorMessage = <any>error); 
            console.log("loaded contracts: " + this.contracts); 
    } 

}