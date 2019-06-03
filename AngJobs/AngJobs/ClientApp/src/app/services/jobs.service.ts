import { Job } from "../jobs/job.model";
import { Resume } from "../jobs/resume.model";
import { JobApplication } from "../jobs/job-application/job-application.model";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable()
export class JobsService {
  jobsChanged = new Subject<Job[]>();
  jobs: Job[] = [];
  pageSize: number = 10;
  resumes: Resume[] = [];
  jobApplications: JobApplication[] = [];
  
  getJobs() {
    console.log('JobService.getJobPosts:', this.jobs);
    return this.jobs.reverse().slice(0, this.pageSize);
  }

  setJobPosts(jobs: Job[]) {
    console.log('JobService.setJobPosts:', jobs);
    this.jobs = jobs;
    this.jobsChanged.next(this.jobs.reverse().slice(0, this.pageSize));
  }

  setResumes(resumes: Resume[]) {
    this.resumes = resumes;
  }

  setJobApplications(jobApplications: JobApplication[]) {
    this.jobApplications = jobApplications;
  }

  getResumes(): Array<Resume> {
    return this.resumes;
  }

  getJobApplications(): any {
    return this.jobApplications;
  }

  addJob(job: Job) {
    this.jobs.push(job);
    this.jobsChanged.next(this.jobs.slice());
  }

  addResume(resume: Resume) {
    this.resumes.push(resume);
    console.log("Resumes", this.resumes);
  }

  addJobApplication(jobApplication: JobApplication) {
    this.jobApplications.push(jobApplication);
    console.log("jobApplication", this.jobApplications);

  }

  generateResumeName(): string {
    var date = new Date(),
      locale = "en-uk",
      month = date.toLocaleString(locale, {
        month: "short"
      }),
      year = date.getFullYear(),
      i = this.resumes.length;

    let title = 'resume-' + month + '-' + year + (i > 0 ? '-('+i+')' : '');
   
    return title;
  }

  constructor() {
   
  }
}
