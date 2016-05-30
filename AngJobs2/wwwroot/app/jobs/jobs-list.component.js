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
const jobdetail_1 = require('./jobdetail');
const job_filter_pipe_1 = require('./job-filter.pipe');
const shared_service_1 = require('../core/shared.service');
let JobsListComponent = class JobsListComponent {
    constructor(_router, _jobsService, _sharedService) {
        this._router = _router;
        this._jobsService = _jobsService;
        this._sharedService = _sharedService;
        this.errorMessage = '';
        this.contractFilter = "contract";
        this.permanentFilter = "permanent";
    }
    ngOnInit() {
        this._jobsService.getHomepageJobs()
            .subscribe(jobs => this.homepageJobs = jobs, error => this.errorMessage = error);
    }
    gotoDetail(job) {
        let link = ['JobDetail', { id: job.id }];
        this._sharedService.saveSelectedJob(job);
        this._router.navigate(link);
    }
};
JobsListComponent = __decorate([
    core_1.Component({
        selector: 'jobs-list',
        templateUrl: 'app/jobs/jobs-list.component.html',
        styleUrls: ['app/jobs/jobs-list.component.css'],
        directives: [job_item_component_1.JobItemComponent, router_1.ROUTER_DIRECTIVES, jobdetail_1.JobDetail],
        pipes: [job_filter_pipe_1.JobFilterPipe],
        providers: [jobs_service_1.JobsService, shared_service_1.SharedService]
    }), 
    __metadata('design:paramtypes', [router_1.Router, jobs_service_1.JobsService, shared_service_1.SharedService])
], JobsListComponent);
exports.JobsListComponent = JobsListComponent;
//# sourceMappingURL=jobs-list.component.js.map