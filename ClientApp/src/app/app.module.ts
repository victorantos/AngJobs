import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from "@angular/common/http";
  
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WhoCommentSubjectPipe } from './pipes/who-comment-subject.pipe';
import { InboxComponent } from './inbox/inbox.component';
import { PaginationComponent } from './inbox/pagination/pagination.component';
import { JobDetailsComponent } from './inbox/job-details/job-details.component';
import { BackButtonComponent } from './shared/back-button/back-button.component';
import { SearchBoxComponent } from './search/search-box/search-box.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    WhoCommentSubjectPipe,
    InboxComponent,
    PaginationComponent,
    JobDetailsComponent,
    BackButtonComponent,
    SearchBoxComponent,
   
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
