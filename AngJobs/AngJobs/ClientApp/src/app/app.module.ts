import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { HomeComponent } from './home/home.component';
import { CounterComponent } from './counter/counter.component';
import { FetchDataComponent } from './fetch-data/fetch-data.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatCheckboxModule, MatGridListModule, MatCardModule, MatMenuModule, MatIconModule } from '@angular/material';
import { MyDashComponent } from './my-dash/my-dash.component';
import { MatListModule } from '@angular/material/list';
import { JobsComponent } from './jobs/jobs.component';
import { JobListComponent } from './jobs/job-list/job-list.component';
import { JobItemComponent } from './jobs/job-list/job-item/job-item.component';
import { JobDetailComponent } from './jobs/job-detail/job-detail.component';
import { RecommendationListComponent } from './recommendation-list/recommendation-list.component';
import { RecommendationEditComponent } from './recommendation-list/recommendation-edit/recommendation-edit.component';
import { JobApplyComponent } from './jobs/job-application-list/job-apply/job-apply.component';
import { JobApplicationListComponent } from './jobs/job-application-list/job-application-list.component';
import { CloseDirective } from './shared/close.directive';
import { JobNewComponent } from './jobs/job-new/job-new.component';
import { EditareaComponent } from './shared/editarea.component';
import { TruncatePipe } from './shared/pipes/truncate';
import { LoggingService } from './services/logging.service';
import { JobsService } from './services/jobs.service';
import { ResumeNewComponent } from './jobs/resume-new/resume-new.component';
import { DataStorageService } from './shared/data-storage.service';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    NavMenuComponent,
    HomeComponent,
    CounterComponent,
    FetchDataComponent,
    MyDashComponent,
    JobsComponent,
    JobListComponent,
    JobItemComponent,
    JobDetailComponent,
    RecommendationListComponent,
    RecommendationEditComponent,
    JobApplyComponent,
    JobApplicationListComponent,
    CloseDirective,
    JobNewComponent,
    EditareaComponent,
    TruncatePipe,
    ResumeNewComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'counter', component: CounterComponent },
      { path: 'fetch-data', component: FetchDataComponent },
    ], { useHash: false }),
    BrowserAnimationsModule,
    MatButtonModule, MatCheckboxModule, MatGridListModule, MatCardModule, MatMenuModule, MatIconModule, MatListModule
  ],
  providers: [LoggingService, JobsService, DataStorageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
