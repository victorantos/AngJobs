angular.module('employer')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('employer.seeking', {
                    url: '/seeking',
                    views: {
                        '': {
                            templateUrl: 'App/SeekingWork',
                            controller: ['$scope', 'employer', function ($scope, employer) {
                                $scope.freelancers = null;
                                employer.getFreelancers().then(function (data) {
                                    console.log('getting freelancers');
                                    $scope.freelancers = data;
                                });
                                
                            }]
                        },
                        'dashboardTitleHeader@employer': {
                            template: 'New Feature - Seeking Work <span class="badge">work in progress</span> ',
                            controller: function ($scope) {
                            }
                        }
                    }
                })
        }]);
