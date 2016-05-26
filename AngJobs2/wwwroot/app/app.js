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
//import { Routes, APP_ROUTES } from './routes.config';
const http_1 = require('angular2/http');
const people_service_1 = require('./people/people.service');
const Home_1 = require('./home/Home');
const About_1 = require('./about/About');
const People_1 = require('./people/People');
const PersonDetail_1 = require('./people/PersonDetail');
let App = class App {
};
App = __decorate([
    core_1.Component({
        selector: 'app',
        templateUrl: './app/app.html',
        styleUrls: ['./app/app.css'],
        directives: [router_1.ROUTER_DIRECTIVES],
        providers: [people_service_1.PeopleService, router_1.ROUTER_PROVIDERS, http_1.HTTP_PROVIDERS]
    }),
    router_1.RouteConfig([
        { path: '/', name: 'Home', component: Home_1.Home, useAsDefault: true },
        { path: '/about', name: 'About', component: About_1.About },
        { path: '/people', name: 'People', component: People_1.People },
        { path: '/people/:id', name: 'Detail', component: PersonDetail_1.PersonDetail }
    ]), 
    __metadata('design:paramtypes', [])
], App);
exports.App = App;
//# sourceMappingURL=app.js.map