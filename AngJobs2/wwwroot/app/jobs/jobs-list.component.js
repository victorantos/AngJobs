"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const core_1 = require('angular2/core');
const router_1 = require('angular2/router');
const jobs_service_1 = require('../jobs/jobs.service');
const job_item_component_1 = require('./job-item.component');
const job_filter_pipe_1 = require('./job-filter.pipe');
let JobsListComponent = class JobsListComponent {
    constructor(_router, _jobsService) {
        this._router = _router;
        this._jobsService = _jobsService;
        this.errorMessage = '';
        this.contractFilter = "contract";
        this.permanentFilter = "permanent";
    }
    ngOnInit() {
        this._jobsService.getHomepageJobs()
            .subscribe(jobs => this.homepageJobs = jobs, error => this.errorMessage = error);
    }
};
JobsListComponent = __decorate([
    core_1.Component({
        selector: 'jobs-list',
        templateUrl: 'app/jobs/jobs-list.component.html',
        directives: [job_item_component_1.JobItemComponent],
        pipes: [job_filter_pipe_1.JobFilterPipe],
        providers: [jobs_service_1.JobsService]
    }), 
    __metadata('design:paramtypes', [router_1.Router, jobs_service_1.JobsService])
], JobsListComponent);
exports.JobsListComponent = JobsListComponent;
//# sourceMappingURL=jobs-list.component.js.map