import { Component, OnInit } from '@angular/core';
import { LoggingService } from './services/logging.service';
import { JobApplication } from './jobs/job-application/job-application.model';
import { JobsService } from './services/jobs.service';
import { Resume } from './jobs/resume.model';
import { DataStorageService } from './shared/data-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']

})
export class AppComponent implements OnInit {
  title = 'app';
  loadedFeature: string[] = ["job"];
  jobApplications: JobApplication[];
  resumes: Resume[];

  constructor(private logging: LoggingService, private jobsService: JobsService, private dataStorageService: DataStorageService) { }

  onNavigate(feature: string | string[]) {

    if (feature === "string") {
      this.loadedFeature = [feature];
    }
    else {
      this.loadedFeature = feature as Array<string>;
    }

    this.logging.log('a new featured has been loaded:', feature);
  }
   
  ngOnInit() {
    this.dataStorageService.retreiveJobPosts();
    this.dataStorageService.retreiveResumes();

    this.jobApplications = this.jobsService.getJobApplications();
    this.resumes = this.jobsService.getResumes();

  }

}
