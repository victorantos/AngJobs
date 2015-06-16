angular.module('register', [])
    .controller('registerCtrl',['$scope','$http', function ($scope, $http) {
        $scope.register = function()
        {
            var params = {
                Email: $scope.username,
                Password: $scope.password1,
                ConfirmPassword: $scope.password2
            };
            $http.post('/api/Account/Register', params)
            .error(function (data, status, headers, config) {
                $scope.message = data.Message;
                $scope.showAlert = true;
            });
        }

        $scope.showAlert = false;
    }]);