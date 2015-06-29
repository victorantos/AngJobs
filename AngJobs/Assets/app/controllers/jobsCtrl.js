angular.module('jobs', ['ui.router'])
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
              .state('jobs', {
                  abstract: true,
                  url: '/',
                  templateUrl: 'App/Jobs',
                  resolve: {
                      jobsAll: ['jobs',
                        function (jobs) {
                            return jobs.all();
                        }] 
                  },
                  controller: ['$scope', 'jobsAll', '$filter', function ($scope, jobsAll, $filter) {
                      $scope.jobsList = jobsAll;
                      $scope.maxItemsPerPage = 100;
                      $scope.filteredItems = $scope.jobsList;
                      $scope.pages = Math.ceil($scope.filteredItems.length / $scope.maxItemsPerPage);

                      $scope.currentPage = 1;

                      $scope.nextPage = function () {
                          $scope.currentPage = $scope.currentPage + 1;
                      }
                      $scope.prevPage = function () {
                          $scope.currentPage = $scope.currentPage - 1;
                      }

                      $scope.$watch('searchBy', function (newVal, oldVal) {
                          console.log("new value in filter box:", newVal);
                          $scope.filteredItems = $filter('filter')($scope.jobsList, newVal);
                          $scope.pages = Math.ceil($scope.filteredItems.length / $scope.maxItemsPerPage);
                      }, true);

                      $scope.$watch('jobsList.length', function (newVal, oldVal) {
                          console.log("job list length changed:", $scope.jobsList.length);
                          $scope.pages = Math.ceil($scope.filteredItems.length / $scope.maxItemsPerPage);
                      });
                  }]
                  // You can pair a controller to your template. There *must* be a template to pair with.
              })
              .state('jobs.filter', {
                  url: 'jobs/filter/:query',
                  template: '<div ui-view></div>',
                  controller: ['$scope', '$rootScope', '$stateParams',
                      function ($scope,$rootScope,$stateParams) {
                          if ($stateParams.query) {
                              $scope.$parent.searchBy = {};
                              $scope.$parent.$parent.query = $stateParams.query;
                          } else
                              $scope.$parent.searchBy = null;
                      }]
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
                               $scope.$parent.searchBy = null;
                           
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
                 controller: ['$scope', '$rootScope', '$http', '$location', '$stateParams', '$state','jobs',
                     function ($scope, $rootScope, $http, $location, $stateParams, $state,jobs) {
                         $scope.$parent.searchBy = {};
                        
                         if ($stateParams.jobType != "inbox")
                             $scope.$parent.searchBy.jobType = $stateParams.jobType;
                         if ($stateParams.location == 'hn') {

                             if (!$rootScope.isHNJobsLoaded) {
                                 $rootScope.isHNJobsLoaded = true;

                                 //load HN jobs first
                                 jobs.getHNJobs().then(function (data) {
                                     $scope.jobsList.push.apply($scope.jobsList, data);
                                 }).then(function () {
                                     $scope.$parent.searchBy.sourceReference = 'hn';
                                 });
                             }
                             else
                                 $scope.$parent.searchBy.sourceReference = 'hn';
                         }
                         else {
                             $scope.$parent.searchBy.jobLocation = $stateParams.location;
                         }
                     }]})
        }])
 