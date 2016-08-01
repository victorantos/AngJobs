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
//import {Routes} from '../routes.config';
const jobs_list_component_1 = require('../jobs/jobs-list.component');
let Home = class Home {
    constructor(_router) {
        this._router = _router;
        this.errorMessage = '';
    }
    goToPeople() {
        this._router.navigate(['People', {}]);
    }
    ngOnInit() {
    }
};
Home = __decorate([
    core_1.Component({
        selector: 'home',
        templateUrl: './app/home/home.html',
        directives: [jobs_list_component_1.JobsListComponent]
    }), 
    __metadata('design:paramtypes', [router_1.Router])
], Home);
exports.Home = Home;
//# sourceMappingURL=Home.js.map