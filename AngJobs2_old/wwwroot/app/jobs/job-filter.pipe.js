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
const core_1 = require("angular2/core");
let JobFilterPipe = class JobFilterPipe {
    transform(value, filter) {
        if (value == null) {
            return null;
        }
        filter = filter ? filter : null;
        return filter ? value.filter((job) => job.jobType.indexOf(filter) !== -1) : value;
    }
};
JobFilterPipe = __decorate([
    core_1.Pipe({
        name: 'jobFilter'
    }), 
    __metadata('design:paramtypes', [])
], JobFilterPipe);
exports.JobFilterPipe = JobFilterPipe;
//# sourceMappingURL=job-filter.pipe.js.map