"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LoggingService = /** @class */ (function () {
    function LoggingService() {
    }
    LoggingService.prototype.log = function (message) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        return console.log(message, optionalParams);
    };
    return LoggingService;
}());
exports.LoggingService = LoggingService;
//# sourceMappingURL=logging.service.js.map