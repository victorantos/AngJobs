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
const people_service_1 = require('./people.service');
let PersonDetail = class PersonDetail {
    constructor(_peopleService, _routeParams, _router) {
        this._peopleService = _peopleService;
        this._routeParams = _routeParams;
        this._router = _router;
        let id = +this._routeParams.get('id');
        _peopleService.getPerson(id)
            .subscribe(res => this.person = res);
    }
};
PersonDetail = __decorate([
    core_1.Component({
        selector: 'person-detail',
        templateUrl: './app/people/person.html',
        directives: [],
        inputs: ['person']
    }), 
    __metadata('design:paramtypes', [people_service_1.PeopleService, router_1.RouteParams, router_1.Router])
], PersonDetail);
exports.PersonDetail = PersonDetail;
//# sourceMappingURL=PersonDetail.js.map