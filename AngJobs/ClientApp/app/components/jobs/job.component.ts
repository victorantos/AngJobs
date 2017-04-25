import { Component, Input, OnInit } from "@angular/core";
import { SharedService } from "../../services/shared.service";
import { FlickrPhoto } from "../../model/FlickrPhoto";
import { Observable } from "rxjs/Observable";

@Component(
    {
        templateUrl: './job.component.html'
    })
export class JobComponent implements OnInit {
    @Input() id: number;

    officePhoto: Observable<FlickrPhoto>;
    constructor(private sharedService: SharedService)
    {
        
    }

    ngOnInit()
    {
        this.officePhoto = this.sharedService.GetRandomOfficeImage();
        this.officePhoto.subscribe(r => console.log(r));
    }
}