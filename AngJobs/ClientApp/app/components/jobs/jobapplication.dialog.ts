import { MdDialog, MdDialogRef } from '@angular/material';
import { Component} from "@angular/core";
@Component({
    selector: 'job-application-dialog',
    templateUrl: './jobapplication.dialog.html',
})
export class JobApplicationDialog {
    constructor(public dialogRef: MdDialogRef<JobApplicationDialog>) { }
}