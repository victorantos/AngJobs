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
  constructor() { }

  ngOnInit() {
  }

  onAddJob(f: NgForm) {
    const value = f.value;
    const newJob = new Job(value.title, value.description, null, null);

    this.newJobCreated.emit(newJob);
  }
}
