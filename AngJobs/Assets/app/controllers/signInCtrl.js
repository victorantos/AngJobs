angular.module('signIn', ['ngCookies'])
    .controller('signInCtrl',['$scope','$http','$cookies','$cookieStore','$location', function ($scope, $http, $cookies, $cookieStore, $location) {
        
        $scope.signIn = function () {
            var params = "grant_type=password&username=" + $scope.username + "&password=" + $scope.password;
            $http({
                url: '/Token',
                method: "POST",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: params
            })
            .success(function (data, status, headers, config) {
                $http.defaults.headers.common.Authorization = "Bearer " + data.access_token;
                
                $cookieStore.put('_Token', data.access_token);
                window.location = '/';
            })
            .error(function (data, status, headers, config) {
                $scope.message = data.error_description;
                $scope.showAlert = true;
            });
        }

        $scope.showAlert = false;
    }]);