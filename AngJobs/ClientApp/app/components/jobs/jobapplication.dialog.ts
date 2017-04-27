import { MdDialog, MdDialogRef } from '@angular/material';
import { Component } from "@angular/core";
import { FileSelectDirective, FileUploader, Headers } from 'ng2-file-upload/ng2-file-upload';


const URL = '/api/upload';

@Component({
    selector: 'job-application-dialog',
    templateUrl: './jobapplication.dialog.html',
})
export class JobApplicationDialog {
    public uploader: FileUploader = new FileUploader({ url: URL, autoUpload: true });
    public fullName: string;
    public emailAddress: string;
    public message: string;
    constructor(public dialogRef: MdDialogRef<JobApplicationDialog>) {
    }
     
}