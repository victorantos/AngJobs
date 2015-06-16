angular.module('developer', ['ngCookies', 'ui.router'])
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('developer.applications', {
                url: '/applications',
                template: '<div ui-view></div>',
                resolve: {
                    jobApplications: ['$cookies','jobs',
                    function ($cookies, jobs) {
                        return jobs.getJobApplicationsForRecruiter($cookies.guid);
                    }]
                },
                views: {
                    '': {
                        templateUrl: 'App/JobApplications',
                        controller: ['$scope', 'jobApplications', function ($scope, jobApplications) {
                            $scope.dailyJobApplications = jobApplications;
                        }]
                    },
                    'dashboardTitle@developer': {
                        template: '',
                        controller: function ($scope) {
                        }
                    }
                }
            })
        }])
     .filter('keys', function () {
         return function (input) {
             if (!input) {
                 return [];
             }
             return Object.keys(input);
         }
     });