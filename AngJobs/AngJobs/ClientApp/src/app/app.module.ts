import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { HomeComponent } from './home/home.component';
import { CounterComponent } from './counter/counter.component';
import { FetchDataComponent } from './fetch-data/fetch-data.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatCheckboxModule, MatGridListModule, MatCardModule, MatMenuModule, MatIconModule } from '@angular/material';
import { MyDashComponent } from './my-dash/my-dash.component';
import { MatListModule } from '@angular/material/list';
import { JobDetailComponent } from './job-detail/job-detail.component';
import { JobListComponent } from './job-list/job-list.component';
import { JobCreateComponent } from './job-create/job-create.component';
import { JobApplyComponent } from './job-apply/job-apply.component';
import { JobSearchComponent } from './job-search/job-search.component';
import { JobApplicationsComponent } from './job-applications/job-applications.component';

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    HomeComponent,
    CounterComponent,
    FetchDataComponent,
    MyDashComponent,
    JobDetailComponent,
    JobListComponent,
    JobCreateComponent,
    JobApplyComponent,
    JobSearchComponent,
    JobApplicationsComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'counter', component: CounterComponent },
      { path: 'fetch-data', component: FetchDataComponent },
      { path: 'job-detail', component: JobDetailComponent },
      { path: 'job-list', component: JobListComponent },
      { path: 'job-create', component: JobCreateComponent },
      { path: 'job-apply', component: JobApplyComponent },
      { path: 'job-applications', component: JobApplicationsComponent },
    ]),
    BrowserAnimationsModule,
    MatButtonModule, MatCheckboxModule, MatGridListModule, MatCardModule, MatMenuModule, MatIconModule, MatListModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
