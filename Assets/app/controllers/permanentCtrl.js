angular.module('permanent', [])
    .controller('permanentCtrl', ['$scope', '$http', 'jobsList', function ($scope, $http, jobsList) {
        $scope.list = jobsList;

    }]);