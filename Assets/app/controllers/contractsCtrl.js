angular.module('contracts', [])
    .controller('contractsCtrl', ['$scope', '$http', 'jobsList', function ($scope, $http, jobsList) {
        $scope.list = jobsList;
    }]);