System.register(['angular2/platform/browser', './app', './core/shared.service'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var browser_1, app_1, sharedService_1;
    return {
        setters:[
            function (browser_1_1) {
                browser_1 = browser_1_1;
            },
            function (app_1_1) {
                app_1 = app_1_1;
            },
            function (sharedService_1_1) {
                sharedService_1 = sharedService_1_1;
            }],
        execute: function() {
            browser_1.bootstrap(app_1.App, [sharedService_1.SharedService])
                .then(function (success) { return console.log("Bootstrap success"); })
                .catch(function (error) { return console.log(error); });
        }
    }
});
//# sourceMappingURL=bootstrap.js.map