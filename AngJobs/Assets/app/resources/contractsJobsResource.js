angular.module('contractsJobs.resource', [])
.factory('contractsJobsResource', ['$resource', '$http', function ($resource, $http) {

    return $resource('/api/contractsJobs');
}]);