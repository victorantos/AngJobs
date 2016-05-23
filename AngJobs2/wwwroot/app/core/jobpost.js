System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var JobPost;
    return {
        setters:[],
        execute: function() {
            JobPost = (function () {
                function JobPost() {
                }
                Object.defineProperty(JobPost.prototype, "shortTitle", {
                    get: function () {
                        return this.title;
                    },
                    enumerable: true,
                    configurable: true
                });
                return JobPost;
            }());
            exports_1("JobPost", JobPost);
        }
    }
});
//# sourceMappingURL=jobpost.js.map