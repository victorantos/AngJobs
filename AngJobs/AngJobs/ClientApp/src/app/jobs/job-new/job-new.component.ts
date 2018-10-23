import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Job } from '../job.model';
import { EditareaComponent } from '../../shared/editarea.component';

@Component({
  selector: 'app-job-new',
  templateUrl: './job-new.component.html',
  styleUrls: ['./job-new.component.css']
})
export class JobNewComponent implements OnInit {
  @ViewChild('ed') ed: EditareaComponent;
  @Output() newJobCreated = new EventEmitter<Job>();
  @Output() trySubmitForm = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {
  }

  onAddJob(f: NgForm) {
    const value = f.value;
    const newJob = new Job(value.title, value.description, null, null);

    if (newJob.title != '' && newJob.description != '') {
      this.newJobCreated.emit(newJob);
      this.trySubmitForm.emit(true);
    }
    else {
      this.trySubmitForm.emit(false);
    }
  }
}
