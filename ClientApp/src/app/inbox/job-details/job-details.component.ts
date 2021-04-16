import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { WhoPostComment } from '../../models/WhoPostComment';
import { HnjobsService } from '../../services/hnjobs.service';
import { Location } from '@angular/common'

@Component({
  selector: 'app-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.scss']
})
export class JobDetailsComponent implements OnInit {
  job$: Observable<WhoPostComment>;
  id: any;

  constructor(private hnjobs: HnjobsService,
    private route: ActivatedRoute,
    private location: Location) {
    
  }

  ngOnInit(): void {

    this.job$ = this.route.paramMap
      .pipe(
        switchMap((params: ParamMap) =>
          this.hnjobs.getWhoPostComment(params.get('id'))
        ));
  }
}
