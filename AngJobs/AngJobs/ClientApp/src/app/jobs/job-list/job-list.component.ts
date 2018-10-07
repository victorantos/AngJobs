import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { Job } from '../job.model';

@Component({
  selector: 'app-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css']
})
export class JobListComponent implements OnInit {
  @Output() jobWasSelected = new EventEmitter<Job>();
  jobs: Job[] = [
    new Job(
      'senior dev C#', 'london based job',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwp1q11eLnFrde0uXFyCWGPmUkZkhT7wNmln7-hjjBP5hoHRg8bA')
    , new Job(
      'junior dev C#', 'london based job',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwp1q11eLnFrde0uXFyCWGPmUkZkhT7wNmln7-hjjBP5hoHRg8bA')
    , new Job(
      'software dev C#', 'london based job',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHaJIZ29RnvxK04qT_fadhJQ7cW7n1KcemPiuCTx365SiYdkdAsw')

  ];
  constructor() { }

  onJobSelected(job: Job) {
    this.jobWasSelected.emit(job);
  }
  ngOnInit() {
  }

}
