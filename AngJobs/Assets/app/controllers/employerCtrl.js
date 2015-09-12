angular.module('employer', ['ngCookies', 'ui.router'])
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('employer.jobs', {
                url: '/jobs',
                resolve: {
                    jobs: ['$cookies', 'jobs',
                    function ($cookies, jobs) {
                        return jobs.byRecruiter($cookies.guid);
                    }]
                },
                views: {
                    '': {
                        templateUrl: 'App/Jobs',
                        controller: ['$scope', 'jobs', function ($scope, jobs) {
                            $scope.jobsList = jobs; 
                        }]
                    },
                    'dashboardTitle@employer': {
                        template: '<h4 class="wrapper">My jobs postings</h4>',
                        controller: function ($scope) {
                        }
                    }
                }

            })
            .state('employer.applications', {
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
                        controller: ['$scope', 'jobApplications', 'utils', function ($scope, jobApplications, utils) {

                            if (utils.isEmptyObject(jobApplications)) {
                                $scope.isEmptyList = true;
                            }
                            $scope.dailyJobApplications = jobApplications;

                             
                        }]
                    },
                    'dashboardTitle@employer': {
                        template: '',
                        controller: function ($scope) {
                        }
                    }
                }
            })
            .state('employer.candidates', {
                url: '/candidates',
                template: '<div ui-view></div>',
                views: {
                    '': {
                    },
                    'dashboardTitle@employer': {
                        template: '<h4 class="wrapper">Selected candidates</h4>',
                        controller: ['$scope',function ($scope) {
                        }]
                    }
                }
            })
            .state('employer.resumes', {
                  url: '/resumes',
                  template: '<div ui-view></div>',
                  url: '/resumes',
                  template: '<div ui-view></div>',
                  resolve: {
                      devResumes: ['cvs',
                      function (devResumes) {
                          return devResumes.get();
                      }]
                  },
                  views: {
                      '': {
                          templateUrl: 'App/Resumes',
                          controller: ['$scope', 'devResumes', function ($scope, devResumes) {
                              $scope.resumes = devResumes.cvs;
                          }]
                      },
                      'dashboardTitle@developer': {
                          template: '',
                          controller: function ($scope) {
                          }
                      }
                  }
              })
            .state('jobapplication', {
                url: '/jobapplication/:id',
                resolve: {
                    jobApplication: ['jobs', '$stateParams',
                     function (jobs, $stateParams) {
                         return jobs.getJobApplication($stateParams.id);
                     }]
                },
                templateUrl: 'App/JobApplication',
                controller: ['$scope', 'jobApplication',
                    function ($scope, jobApplication) {
                        $scope.ja = jobApplication;
                    }]
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