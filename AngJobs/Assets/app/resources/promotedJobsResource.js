angular.module('promotedJobs.resource', [])
.factory('promotedJobsResource', ['$resource', '$http', function ($resource, $http) {

   return $resource('/api/promotedJobs');
}]);