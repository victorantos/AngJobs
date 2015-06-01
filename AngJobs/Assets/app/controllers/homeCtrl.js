angular.module('home', [])
    .controller('homeCtrl', ['$scope', '$http', 'jobsList', function ($scope, $http, jobsList) {

        $scope.list = jobsList;
    }]);