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
const jobs_service_1 = require('../jobs/jobs.service');
const router_1 = require('angular2/router');
let JobDetail = class JobDetail {
    constructor(_jobsService, _routeParams, _router) {
        this._jobsService = _jobsService;
        this._routeParams = _routeParams;
        this._router = _router;
        let id = +this._routeParams.get('id');
        _jobsService.getJobDetail(id)
            .subscribe(res => this.jobPost = res);
    }
};
JobDetail = __decorate([
    core_1.Component({
        selector: 'job-detail',
        templateUrl: './app/jobs/job-detail.html',
        directives: [],
        inputs: ['jobpost']
    }), 
    __metadata('design:paramtypes', [jobs_service_1.JobsService, router_1.RouteParams, router_1.Router])
], JobDetail);
exports.JobDetail = JobDetail;
//# sourceMappingURL=jobdetail.js.map