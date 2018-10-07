import { Component, OnInit, Input } from '@angular/core';
import { Job } from '../job.model';

@Component({
  selector: 'app-job-detail',
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css']
})
export class JobDetailComponent implements OnInit {
  @Input() job: Job;
  constructor() { }

  onSelected($event) {
    this.job = $event;
  }
  ngOnInit() {
  }

}
