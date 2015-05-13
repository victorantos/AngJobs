angular.module('jobs.resource', [])
.factory('jobsResource', ['$resource', '$http', function ($resource, $http) {

    var hotPath = '/api/Jobs/Get';

    var hotJobs = $http.get(hotPath).then(function (resp) {
        return resp.data;
    });
 

    var factory = {};
    factory.hotJobs = function () {
        return hotJobs;
    };
    
   // return factory;
   return $resource('/api/jobs');
}]);