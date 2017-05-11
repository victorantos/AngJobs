import { Component, Input, OnInit } from "@angular/core";
import { Http } from "@angular/http";
import { ActivatedRoute, Params } from "@angular/router";
import { SharedService } from "../../services/shared.service";
import { FlickrPhoto } from "../../model/FlickrPhoto";
import { Observable } from "rxjs/Observable";

import 'rxjs/add/operator/switchMap';

import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';
import { JobApplicationDialog } from './jobapplication.dialog';
import { JobDetail } from '../../model/JobDetail';

@Component(
    {
        templateUrl: './job.component.html'
    })
export class JobComponent implements OnInit {
    jobDetail: JobDetail;
    jobId: number;
    officePhoto: Observable<FlickrPhoto>;

    constructor(private http: Http, public dialog: MdDialog,
        private sharedService: SharedService,
        private route: ActivatedRoute)
    {
    }

    ngOnInit() : void
    {
        console.log("ngoninit");
        this.officePhoto = this.sharedService.GetRandomOfficeImage();

        this.route.params.subscribe(params => {
            this.jobId = +params['id']; // (+) converts string 'id' to a number

            // In a real app: dispatch action to load the details here.
            this.sharedService.GetJobDetail(+params['id']).then(result => this.jobDetail = result);

        });
    }

    applyForJob(dialogForm: JobApplicationDialog) {
        let data = {
            message: dialogForm.message,
            uploadedDocs: dialogForm.uploadIds,
            applicant: {
                name: dialogForm.fullName,
                email: dialogForm.emailAddress,
            }
        
        };

        this.sharedService.ApplyForJob(data).subscribe(result => console.log(result));
    }

    openJobApplication()
    {
        let config: MdDialogConfig = {
            disableClose: false,
            width: '',
            height: '',
            position: {
                top: '',
                bottom: '',
                left: '',
                right: ''
            },
            data: {
                jobId: this.jobId
            }
        };
        let dialogRef = this.dialog.open(JobApplicationDialog, config);
        dialogRef.afterClosed().subscribe(result => {
            if (result == "send")
                this.applyForJob(dialogRef.componentInstance);
        });
    }
}
