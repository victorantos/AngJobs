import { Component, OnInit } from '@angular/core';
import { Job } from './job.model';
import { JobApplication } from './job-application/job-application.model';
import { JobsService } from '../services/jobs.service';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css']
})
export class JobsComponent implements OnInit {
  selectedJob: Job;
  jobApplications: JobApplication[] = [];
  jobs: Job[] = [];

  constructor(private jobsService: JobsService) { }

  addJobApplication($event) {
    this.jobsService.addJobApplication($event);
  }

  addToJobList($event) {
    this.jobs.push($event);
  }

  ngOnInit() {
  }

  reInit() {
    this.selectedJob = null;
  }
}
