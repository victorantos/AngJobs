import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Resume } from '../resume.model';
import { JobsService } from '../../services/jobs.service';
import { DataStorageService } from '../../shared/data-storage.service';

@Component({
  selector: 'app-resume-new',
  templateUrl: './resume-new.component.html',
  styleUrls: ['./resume-new.component.css']
})
export class ResumeNewComponent implements OnInit {
  @Output() newResumeCreated = new EventEmitter<Resume>();
  @Output() trySubmitForm = new EventEmitter<boolean>();
  constructor(private jobService: JobsService, private dataStorageService: DataStorageService) { }

  resumes:Resume[] = [];

  ngOnInit() {
  }

  onAddResume(f: NgForm) {
    const value = f.value;
    const newResume = new Resume(value.title, value.description);
    newResume.title = this.jobService.generateResumeName();
  

    if (newResume.title != '' && newResume.description != '') {
      this.newResumeCreated.emit(newResume);
      this.trySubmitForm.emit(true);

      //save resume
      this.jobService.addResume(newResume);
     
      this.dataStorageService.storeResumes();

      //get all resumes
      this.resumes = this.jobService.getResumes();

    }
    else {
      this.trySubmitForm.emit(false);
    }
  }

}
