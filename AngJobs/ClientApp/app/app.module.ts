import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppComponent } from './components/app/app.component';

import { NavMenuComponent } from './components/navmenu/navmenu.component';
import { HomeComponent } from './components/home/home.component';
import { FetchDataComponent } from './components/fetchdata/fetchdata.component';
import { CounterComponent } from './components/counter/counter.component';
import { MaterialModule } from '@angular/material';

import { DialogContent } from './components/app/dialogcontent'
import { JobApplicationDialog } from './components/jobs/jobapplication.dialog';

import { JobsListComponent } from './components/app/jobslist.component';
import { JobComponent } from './components/jobs/job.component';

import { FileSelectDirective } from 'ng2-file-upload';

export const sharedConfig: NgModule = {
    bootstrap: [ AppComponent ],
    declarations: [
        AppComponent,
        NavMenuComponent,
        CounterComponent,
        FetchDataComponent,
        HomeComponent,
        DialogContent,
        JobsListComponent,
        JobComponent,
        JobApplicationDialog,
        FileSelectDirective
    ],
    entryComponents: [DialogContent, JobApplicationDialog],
    imports: [
        RouterModule.forRoot([
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: HomeComponent },
            { path: 'counter', component: CounterComponent },
            { path: 'fetch-data', component: FetchDataComponent },
            { path: "job/:id", component: JobComponent },
            { path: '**', redirectTo: 'home' }
        ]),
        MaterialModule
    ]    
};
