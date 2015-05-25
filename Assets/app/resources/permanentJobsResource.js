angular.module('permanentJobs.resource', [])
.factory('permanentJobsResource', ['$resource', '$http', function ($resource, $http) {

    return $resource('/api/permanentJobs');
}]);