angular.module('employer')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('employer.consultants', {
                    url: '/consultants',
                    views: {
                        '': {
                            templateUrl: 'App/Consultants',
                            controller: ['$scope', '$http', function ($scope, $http) {
                                $scope.subscribed = false;
                                $scope.subscribe = function () {
                                    //save email
                                    console.log("Email is logged", $scope.email);
                                    var subscriber = { email: $scope.email };
                                    $http.post("/api/inprogress/save", subscriber).success(function (data, status, headers, config) {
                                        // 400/500 errors show up here
                                        if (status == 400) {
                                            console.log('Bad email address or other issue');
                                        }
                                        else
                                        {
                                            $scope.subscribed = true;
                                        }
                                    });
                                };
                            }]
                        },
                        'dashboardTitleHeader@employer': {
                            template: 'New Feature - Search IT Consultants <span class="badge">work in progress</span> ',
                            controller: function ($scope) {
                            }
                        }
                    }

                })
        }]);
            
    