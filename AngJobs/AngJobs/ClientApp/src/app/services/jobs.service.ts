import { Job } from "../jobs/job.model";
import { Resume } from "../jobs/resume.model";
import { JobApplication } from "../jobs/job-application/job-application.model";
import { Injectable } from "@angular/core";

@Injectable()
export class JobsService {
  
  jobs: Job[] = [];
  resumes: Resume[] = [];
  jobApplications: JobApplication[] = [];
 
  getJobs() {
    
    return this.jobs;
  }

  setJobPosts(jobs: Job[]) {
    this.jobs = jobs;
  }

  getResumes(): Array<Resume> {
    return this.resumes;
  }

  getJobApplications(): any {
    return this.jobApplications;
  }

  addJob(job: Job) {
    this.jobs.push(job);
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
    //some default jobs
    //const data = [
    //  new Job(
    //    'C# Developer - ASP.NET/JavaScript/SQL Server/Python',
    //    `C# Developer - ASP.NET/JavaScript/SQL Server/Python - This is a long term contract opportunity for an experienced .NET Developer to join a global financial services organisation.
    //              Your experience / skills:

    //          C# Development experience - Front End and Back End development experience
    //              JavaScript and MS SQL Server 2016 know - how
    //              Python is highly desirable
    //              Good knowledge of object - oriented and functional programming paradigms, experience in Tableau is a plus
    //              Good understanding of financial instruments and transactions, especially related to asset management is an advantage
    //              Languages: fluent English both written and spoken
    //              Your tasks:

    //          Ensuring interfacing with an external calculation application and storing the data in an existing internal database
    //          Fulfilling export of data into a new star - schema based database
    //          Designing and operating quality checks on the received data, including time series analysis
    //          Performing.NET - based GUIs to business users to visualise data and configure calculation settings
    //          Processing incoming data from various sources, including databases, Excel files, PDFs, csv and Bloomberg
    //          Applying calculation transformations in Python to the data and producing aggregated reporting results`

    //    , 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwp1q11eLnFrde0uXFyCWGPmUkZkhT7wNmln7-hjjBP5hoHRg8bA'
    //    , 'Zurich, Switzerland')
    //  , new Job('junior dev C#'
    //    , 'london based job',
    //    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwp1q11eLnFrde0uXFyCWGPmUkZkhT7wNmln7-hjjBP5hoHRg8bA'
    //    , '')
    //  , new Job('software dev C#'
    //    , 'london based job',
    //    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHaJIZ29RnvxK04qT_fadhJQ7cW7n1KcemPiuCTx365SiYdkdAsw'
    //    , '')

    //];

    //for (let i of data) {
    //  this.jobs.push(i);
    //}
  }
  
}
