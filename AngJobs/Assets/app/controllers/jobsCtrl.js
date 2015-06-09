angular.module('jobs', ['ui.router'])
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
              .state('jobs', {
                  abstract: true,
                  url: '/',
                  templateUrl: 'App/Jobs',
                  resolve: {
                      jobsResource: 'jobsResource',
                      jobsList: function (jobsResource) {
                          return jobsResource.query();
                      }
                  },
                  controller: ['$scope', 'jobsList', function ($scope, jobsList) {
                      $scope.jobsList = jobsList;
                  }]
                  // You can pair a controller to your template. There *must* be a template to pair with.
              })
              .state('jobs.jobType', {
                  url: 'jobs/:jobType',
                  template: '<div ui-view></div>',
                  controller: ['$scope', '$rootScope', '$http', '$location', '$stateParams', '$state',
                       function ($scope, $rootScope, $http, $location, $stateParams, $state) {
                           if ($stateParams.jobType && $stateParams.jobType != 'inbox') {
                               $scope.$parent.searchBy = {};
                               if ($stateParams.jobType == 'remote')
                                   $scope.$parent.searchBy.jobType = "freelance";
                               else
                                   $scope.$parent.searchBy.jobType = $stateParams.jobType;
                           }
                           else
                               $scope.$parent.searchBy = {};
                           
                           $scope.reset = function () {
                               $scope.$parent.query = '';
                           }

                           $scope.goTo = function (path) {
                               $location.go(path);
                           }
                       }]
              })
             .state('jobs.jobType.location', {
                 url: '/:location',
                controller: ['$scope', '$rootScope', '$http', '$location', '$stateParams', '$state',
                     function ($scope, $rootScope, $http, $location, $stateParams, $state) {
                         $scope.$parent.searchBy = {};
                         if ($stateParams.jobType != "inbox")
                             $scope.$parent.searchBy.jobType = $stateParams.jobType;
                         if ($stateParams.location == 'hn') {
                             $scope.$parent.searchBy.sourceReference = 'hn';
                         }
                         else {
                             $scope.$parent.searchBy.jobLocation = $stateParams.location;
                         }
                     }]})
        }])
 