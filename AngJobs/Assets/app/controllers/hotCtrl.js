angular.module('hot', [])
    .controller('hotCtrl', ['$scope', '$http', 'hotlist', '$rootScope', function ($scope, $http, hotlist, $rootScope) {
        $scope.hotJobs = hotlist; 
    }]);