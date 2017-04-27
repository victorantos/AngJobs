import { Component, Input, OnInit } from "@angular/core";
import { SharedService } from "../../services/shared.service";
import { FlickrPhoto } from "../../model/FlickrPhoto";
import { Observable } from "rxjs/Observable";
import { MdDialog, MdDialogRef } from '@angular/material';
import { JobApplicationDialog } from './jobapplication.dialog';

@Component(
    {
        templateUrl: './job.component.html'
    })
export class JobComponent implements OnInit {
    @Input() id: number;

    officePhoto: Observable<FlickrPhoto>;
    constructor(public dialog: MdDialog, private sharedService: SharedService)
    {
        
    }

    ngOnInit()
    {
        this.officePhoto = this.sharedService.GetRandomOfficeImage();
    }

    applyForJob(dialogForm: JobApplicationDialog) {
        let data = {
            message: dialogForm.message,
            applicant: {
                name: dialogForm.fullName,
                email: dialogForm.emailAddress,
            }
        
        };

        this.sharedService.ApplyForJob(data).subscribe(result => console.log(result));
    }

    openJobApplication()
    {
        let dialogRef = this.dialog.open(JobApplicationDialog);
        dialogRef.afterClosed().subscribe(result => {
            if (result == "send")
                this.applyForJob(dialogRef.componentInstance);
        });
    }
}
