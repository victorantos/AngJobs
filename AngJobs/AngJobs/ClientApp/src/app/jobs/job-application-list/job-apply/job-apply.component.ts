import { Component, OnInit, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { Job } from '../../job.model';
import { JobApplication } from '../../job-application/job-application.model';
import { emit } from 'cluster';

@Component({
  selector: 'app-job-apply',
  templateUrl: './job-apply.component.html',
  styleUrls: ['./job-apply.component.css']
})
export class JobApplyComponent implements OnInit {
  @Output() newJobApplication = new EventEmitter<JobApplication>();
  @Output() cancel = new EventEmitter<void>();
  @Input() job: Job;
  @ViewChild('email') fromEmailEl;
  @ViewChild('message') messageEl;
  constructor() { }

  onApply() {
    this.newJobApplication.emit(
      new JobApplication(
        this.job,
        this.fromEmailEl.nativeElement.value,
        this.messageEl.nativeElement.innerText
      )
    );
  }

  onCancel() {
    this.cancel.emit();
  }
  
  ngOnInit() {
  }

}
