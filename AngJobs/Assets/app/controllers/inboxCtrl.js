angular.module('inbox', [])
    .controller('inboxCtrl', ['$scope', '$http', 'jobsList', function ($scope, $http, jobsList) {
        $scope.list = jobsList;
    }]);