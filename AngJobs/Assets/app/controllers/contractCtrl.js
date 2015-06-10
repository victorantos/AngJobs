angular.module('contract', [])
    .controller('contractCtrl', ['$scope', '$http', 'jobsList', function ($scope, $http, jobsList) {
        $scope.list = jobsList;
    }]);