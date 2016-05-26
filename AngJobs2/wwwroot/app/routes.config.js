"use strict";
const Home_1 = require('./home/Home');
const About_1 = require('./about/About');
const People_1 = require('./people/People');
const PersonDetail_1 = require('./people/PersonDetail');
const router_1 = require('angular2/router');
exports.Routes = {
    home: new router_1.Route({ path: '/', name: 'Home', component: Home_1.Home }),
    about: new router_1.Route({ path: '/about', name: 'About', component: About_1.About }),
    people: new router_1.Route({ path: '/people', name: 'People', component: People_1.People }),
    detail: new router_1.Route({ path: '/people/:id', name: 'Detail', component: PersonDetail_1.PersonDetail })
};
exports.APP_ROUTES = Object.keys(exports.Routes).map(r => exports.Routes[r]);
//# sourceMappingURL=routes.config.js.map