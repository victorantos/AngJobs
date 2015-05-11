angular.module('home', [])
    .controller('homeCtrl',['$scope','$http', function ($scope, $http) {
        $scope.alert = function () {
            alert("WOW");
        }
    }]);