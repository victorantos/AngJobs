import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Job } from '../job.model';
import { JobsService } from '../../services/jobs.service';
import { DataStorageService } from '../../shared/data-storage.service';

@Component({
  selector: 'app-job-new',
  templateUrl: './job-new.component.html',
  styleUrls: ['./job-new.component.css']
})
export class JobNewComponent implements OnInit {
  @Output() newJobCreated = new EventEmitter<Job>();
  @Output() trySubmitForm = new EventEmitter<boolean>();

  constructor(private jobsService: JobsService, private dataStorageService: DataStorageService) {

  }

  ngOnInit() {
  }

  onAddJob(f: NgForm) {
    const value = f.value;
    const newJob = new Job(value.title, value.description, null, null);

    if (newJob.title != '' && newJob.description != '') {
      this.newJobCreated.emit(newJob);
      this.trySubmitForm.emit(true);

      //save new job
      this.jobsService.addJob(newJob);
      this.dataStorageService.storeJobPost();
    }
    else {
      this.trySubmitForm.emit(false);
    }
  }
}
