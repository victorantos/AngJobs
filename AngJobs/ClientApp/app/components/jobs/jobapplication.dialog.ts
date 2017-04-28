import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { Component, Input, Inject } from "@angular/core";
import { FileSelectDirective, FileUploader, Headers } from 'ng2-file-upload/ng2-file-upload';


const URL = '/api/upload';

@Component({
    selector: 'job-application-dialog',
    templateUrl: './jobapplication.dialog.html',
})
export class JobApplicationDialog {
    public jobId: number;
    public uploader: FileUploader = new FileUploader({ url: URL, autoUpload: true });
    public fullName: string;
    public emailAddress: string;
    public message: string;

    constructor(public dialogRef: MdDialogRef<JobApplicationDialog>, @Inject(MD_DIALOG_DATA) public data: any) {

        this.jobId = data.jobId;

        console.log("jobid:", data);
    }
     
}