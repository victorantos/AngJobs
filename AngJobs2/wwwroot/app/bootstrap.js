"use strict";
const browser_1 = require('angular2/platform/browser');
const app_1 = require('./app');
const shared_service_1 = require('./core/shared.service');
browser_1.bootstrap(app_1.App, [shared_service_1.SharedService])
    .then(success => console.log(`Bootstrap success.`))
    .catch(error => console.log(error));
//# sourceMappingURL=bootstrap.js.map