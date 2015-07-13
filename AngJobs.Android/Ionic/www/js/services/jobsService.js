angular.module('jobs.service', [

])

// A RESTful factory for retrieving jobs 
.factory('jobs', ['$http', function ($http, utils) {
    var basePath = "http://AngJobs.com";
    var path = '/api/Jobs/GetJobsList';
    var hotPath = '/api/Jobs/GetHotJobs';
    var factory = {};

    var hotJobs = $http.get(basePath + hotPath, {
        params: { maxJobs: 15 }
    }).then(function (resp) {
        return resp.data;
    });

    factory.hot = function () {
        return hotJobs;
    };

    factory.get = function (jobId) {
        var path = basePath + '/api/Jobs/GetJobDetails';
        var detail = $http.get(path, {
            params: { id: jobId }
        }).then(function (resp) {
            return resp.data;
        })
        return detail;
    };


    return factory;
}]);