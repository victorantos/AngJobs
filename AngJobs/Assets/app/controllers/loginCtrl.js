angular.module('login', [])

    .controller('loginCtrl', ['$scope','$rootScope', '$location', 'authService', 'ngAuthSettings', function ($scope, $rootScope, $location, authService, ngAuthSettings) {

        $scope.loginData = {
            userName: "",
            password: "",
            useRefreshTokens: false
        };

        $scope.message = "";

        $scope.login = function () {

            authService.login($scope.loginData).then(function (response) {

               // $location.path('/orders');

            },
             function (err) {
                 $scope.message = err.error_description;
             });
        };

        $scope.authExternalProvider = function (provider) {

            var redirectUri = location.protocol + '//' + location.host + '/authcomplete.html';

            var externalProviderUrl = ngAuthSettings.authServiceBaseUri + "api/Account/ExternalLogin?provider=" + provider
                                                                        + "&response_type=token&client_id=" + ngAuthSettings.clientId
                                                                        + "&redirect_uri=" + redirectUri;
            window.$windowScope = $scope;

            var oauthWindow = window.open(externalProviderUrl, "Authenticate Account", "location=0,status=0,width=600,height=750");
        };

        $scope.authCompletedCB = function (fragment) {

            console.log("Fragment is here: " + fragment);
            console.dir(fragment);
            $scope.$apply(function () {

                if (fragment.haslocalaccount == 'False') {

                    authService.logOut();

                    authService.externalAuthData = {
                        provider: fragment.provider,
                        userName: fragment.external_user_name,
                        externalAccessToken: fragment.external_access_token
                    };

                    $location.path('/jobdetails/' + $rootScope.$stateParams.jobId +'/signup/LinkedIn');
                }
                else {
                    //Obtain access token application form
                    var externalData = { provider: fragment.provider, externalAccessToken: fragment.external_access_token };
                    authService.obtainAccessToken(externalData).then(function (response) {
                    $location.path('/jobdetails/' + $rootScope.$stateParams.jobId + '/apply/' + externalData.provider);
                    },
                 function (err) {
                     $scope.message = err.error_description;
                 });
                }

            });
        }

    }]);