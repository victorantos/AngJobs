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
const http_1 = require('angular2/http');
const core_1 = require('angular2/core');
const Observable_1 = require('rxjs/Observable');
require('rxjs/Rx');
/**
 * jobs service
 */
let JobsService = class JobsService {
    //   person: Person = null;
    constructor(_http) {
        this._http = _http;
        this._contractsUrl = 'api/contracts.json';
        this.jobPosts = [];
    }
    getJobs() {
        //return an observable
        return this._http.get('/api/jobs')
            .map((response) => {
            return response.json();
        });
    }
    getHomepageJobs() {
        return this._http.get(this._contractsUrl)
            .map((response) => response.json())
            .do(data => console.log("All: " + JSON.stringify(data)))
            .catch(this.handleError);
    }
    getJobDetail(id) {
        return this._http.get('/api/jobs/' + id.toString())
            .map((response) => {
            return response.json();
        });
    }
    handleError(error) {
        // in a real world app, we may send the server to some remote logging infrastructure
        // instead of just logging it to the console
        console.error(error);
        return Observable_1.Observable.throw(error.json().error || 'Server error');
    }
};
JobsService = __decorate([
    core_1.Injectable(), 
    __metadata('design:paramtypes', [http_1.Http])
], JobsService);
exports.JobsService = JobsService;
//# sourceMappingURL=jobs.service.js.map