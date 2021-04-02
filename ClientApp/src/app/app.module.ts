import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from "@angular/common/http";
  
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WhoCommentSubjectPipe } from './pipes/who-comment-subject.pipe';
import { InboxComponent } from './inbox/inbox.component';
import { PaginationComponent } from './inbox/pagination/pagination.component';

@NgModule({
  declarations: [
    AppComponent,
    WhoCommentSubjectPipe,
    InboxComponent,
    PaginationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
