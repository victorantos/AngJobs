import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { Job } from '../job.model';

@Component({
  selector: 'app-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css']
})
export class JobListComponent implements OnInit {
  @Input() jobs: Job[];
  @Output() jobWasSelected = new EventEmitter<Job>();

  constructor() { }

  onJobSelected(job: Job) {
    this.jobWasSelected.emit(job);
  }
  ngOnInit() {

    //some default jobs
    const data = [
      new Job(
        'C# Developer - ASP.NET/JavaScript/SQL Server/Python',
        `C# Developer - ASP.NET/JavaScript/SQL Server/Python - This is a long term contract opportunity for an experienced .NET Developer to join a global financial services organisation.
                  Your experience / skills:

              C# Development experience - Front End and Back End development experience
                  JavaScript and MS SQL Server 2016 know - how
                  Python is highly desirable
                  Good knowledge of object - oriented and functional programming paradigms, experience in Tableau is a plus
                  Good understanding of financial instruments and transactions, especially related to asset management is an advantage
                  Languages: fluent English both written and spoken
                  Your tasks:

              Ensuring interfacing with an external calculation application and storing the data in an existing internal database
              Fulfilling export of data into a new star - schema based database
              Designing and operating quality checks on the received data, including time series analysis
              Performing.NET - based GUIs to business users to visualise data and configure calculation settings
              Processing incoming data from various sources, including databases, Excel files, PDFs, csv and Bloomberg
              Applying calculation transformations in Python to the data and producing aggregated reporting results`

        , 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwp1q11eLnFrde0uXFyCWGPmUkZkhT7wNmln7-hjjBP5hoHRg8bA'
        , 'Zurich, Switzerland')
      , new Job('junior dev C#'
        , 'london based job',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwp1q11eLnFrde0uXFyCWGPmUkZkhT7wNmln7-hjjBP5hoHRg8bA'
        , '')
      , new Job('software dev C#'
        , 'london based job',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHaJIZ29RnvxK04qT_fadhJQ7cW7n1KcemPiuCTx365SiYdkdAsw'
        , '')

    ];

    for (let i of data) {
      this.jobs.push(i);
    }
  }
}
