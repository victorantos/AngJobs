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

    openJobApplication()
    {
        let dialogRef = this.dialog.open(JobApplicationDialog);
        dialogRef.afterClosed().subscribe(result => {
            //this.selectedOption = result;
        });
    }
}
