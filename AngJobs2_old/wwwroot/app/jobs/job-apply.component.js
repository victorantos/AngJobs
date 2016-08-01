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
let JobApplyComponent = class JobApplyComponent {
    constructor() {
        this.discardApplication = new core_1.EventEmitter();
        this.appliedForJob = new core_1.EventEmitter();
    }
    dontSubmit(event, el) {
        console.log('keypressed', event);
        if (event.keyCode == 13) {
            el.focus(); //focus on the msg textarea
            return false;
        }
        return true;
    }
    onSubmit() {
        console.log('form submit');
    }
    sendJobApplication() {
        this.appliedForJob.emit(false);
    }
    discardMsg() {
        this.discardApplication.emit(false);
    }
};
__decorate([
    core_1.Output(), 
    __metadata('design:type', Object)
], JobApplyComponent.prototype, "discardApplication", void 0);
__decorate([
    core_1.Output(), 
    __metadata('design:type', Object)
], JobApplyComponent.prototype, "appliedForJob", void 0);
JobApplyComponent = __decorate([
    core_1.Component({
        selector: 'job-apply',
        templateUrl: 'app/jobs/job-apply.component.html',
        styleUrls: ['app/jobs/job-apply.component.css'],
        directives: []
    }), 
    __metadata('design:paramtypes', [])
], JobApplyComponent);
exports.JobApplyComponent = JobApplyComponent;
//# sourceMappingURL=job-apply.component.js.map