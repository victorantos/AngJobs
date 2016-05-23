import {Component, OnInit } from 'angular2/core';
import {Router} from 'angular2/router';
//import {Routes} from '../routes.config';
import {JobItem} from '../jobs/jobitem';
import {JobsService} from '../jobs/jobsservice';

@Component({
    selector: 'home',
    templateUrl: './app/home/home.html',
    directives: [JobItem]
})
export class Home implements OnInit {
    errorMessage: string = '';
    contracts: Array<any>;

    constructor(private _router: Router, private _jobsService: JobsService) {
    }

    goToPeople() {
        this._router.navigate(['People', {}]);
    }

    ngOnInit(): void {
        this._jobsService.getContracts()
            .subscribe(
            contracts => this.contracts = contracts,
            error => this.errorMessage = <any>error); 
    }

}