import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Job } from '../../job.model';
import { EventEmitter } from 'events';

@Component({
  selector: 'app-job-item',
  templateUrl: './job-item.component.html',
  styleUrls: ['./job-item.component.css']
})
export class JobItemComponent implements OnInit {
  @Input() job: Job;
  @Output() jobSelected = new EventEmitter<void>();
  constructor() { }

  onSelect() {
    this.jobSelected.emit();
  }
  ngOnInit() {
  }

}
