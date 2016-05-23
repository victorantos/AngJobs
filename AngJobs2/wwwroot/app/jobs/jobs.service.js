System.register(['angular2/http', 'angular2/core', 'rxjs/Rx'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var http_1, core_1;
    var JobsService;
    return {
        setters:[
            function (http_1_1) {
                http_1 = http_1_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (_1) {}],
        execute: function() {
            /**
             * jobs service
             */
            JobsService = (function () {
                //   person: Person = null;
                function JobsService(_http) {
                    this._http = _http;
                    this.jobPosts = [];
                }
                JobsService.prototype.getJobs = function () {
                    //return an observable
                    return this._http.get('/api/jobs')
                        .map(function (response) {
                        return response.json();
                    });
                };
                JobsService.prototype.getJobDetail = function (id) {
                    return this._http.get('/api/jobs/' + id.toString())
                        .map(function (response) {
                        return response.json();
                    });
                };
                JobsService = __decorate([
                    core_1.Injectable(), 
                    __metadata('design:paramtypes', [http_1.Http])
                ], JobsService);
                return JobsService;
            }());
            exports_1("JobsService", JobsService);
        }
    }
});
//# sourceMappingURL=jobs.service.js.map