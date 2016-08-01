import {Component, OnInit } from 'angular2/core';
import {Router} from 'angular2/router';
//import {Routes} from '../routes.config';
import {JobsListComponent} from '../jobs/jobs-list.component';

@Component({
    selector: 'home',
    templateUrl: './app/home/home.html',
    directives: [JobsListComponent]
})
export class Home implements OnInit {
    errorMessage: string = '';

    constructor(private _router: Router) {
    }
 
    goToPeople() {    
        this._router.navigate(['People', {}]);
    }
 
    ngOnInit() {
      
    }

}