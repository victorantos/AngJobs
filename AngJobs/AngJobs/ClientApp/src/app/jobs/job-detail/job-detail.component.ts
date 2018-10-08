import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Job } from '../job.model';
import { JobApplication } from '../job-application/job-application.model';

@Component({
  selector: 'app-job-detail',
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css']
})
export class JobDetailComponent implements OnInit {
  @Input() job: Job;
  @Output() newJobApplication = new EventEmitter<JobApplication>();

  constructor() { }

  onSelected($event) {
    this.job = $event;
  }

  onJobApply($event) {
    this.newJobApplication.emit($event);
  }

  ngOnInit() {
  }

}
