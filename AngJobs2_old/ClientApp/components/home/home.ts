import * as ng from '@angular/core';
import { Http } from '@angular/http';
import { JobsList } from '../jobs/jobs-list';

@ng.Component({
  selector: 'home',
  template: require('./home.html'),
  directives: [JobsList]
})
export class Home {
   
  constructor(http: Http)
  {
   
  }
}
 