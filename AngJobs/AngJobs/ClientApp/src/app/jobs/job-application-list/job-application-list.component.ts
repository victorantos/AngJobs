import { Component, OnInit, Input } from '@angular/core';
import { JobApplication } from '../job-application/job-application.model';

@Component({
  selector: 'app-job-application-list',
  templateUrl: './job-application-list.component.html',
  styleUrls: ['./job-application-list.component.css']
})
export class JobApplicationListComponent implements OnInit {
  @Input() applications: JobApplication[];

  constructor() { }

  ngOnInit() {
  }

}
