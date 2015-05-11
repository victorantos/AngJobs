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
            .success(function (data, status, headers, config) {
                $scope.successMessage = "Registration Complete.  Please check your email for account activation instructions.";
                $scope.showErrorMessage = false;
                $scope.showSuccessMessage = true;
            })
            .error(function (data, status, headers, config) {
                if (angular.isArray(data))
                    $scope.errorMessages = data;
                else
                    $scope.errorMessages = new Array(data.replace(/["']{1}/gi, ""));

                $scope.showSuccessMessage = false;
                $scope.showErrorMessage = true;
            });
        }

        $scope.showAlert = false;
        $scope.showSuccess = false;
    }]);