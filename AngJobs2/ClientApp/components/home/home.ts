import * as ng from '@angular/core';
 
import { Http } from '@angular/http';

@ng.Component({
  selector: 'home',
  template: require('./home.html'),
  
})
export class Home {
  public hotJobs: HotJob[];

  constructor(http: Http)
  {
      http.get('api/jobsdata/hotjobs').subscribe(result => {
            this.hotJobs = result.json();
        });
  }
}

interface HotJob{
    jobId: number;
    jobTitle: string;
    summary: string;
}
