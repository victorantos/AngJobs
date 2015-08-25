/* App Module */

var app = angular.module('app', [
    'ui.router',
    'ngCookies',
    'ngFileUpload',
    'stripe',
    'LocalStorageModule',
    'angular-cache',
    'main',
    'utils.service',
    'jobs.service',
    'home',
    'jobs',
    'hot',
    'about',
    'daily',
    'register',
    'login',
    'jobDetails',
    'postJob',
    'angularMoment',
    'associate',
    'employer',
    'developer',
    'pay',
    'services',
    'testimonials'
]);
    

app.constant('ngAuthSettings', {
    apiServiceBaseUri: typeof serviceBase != 'undefined' ? serviceBase : 'https://angjobs.com/',
    authServiceBaseUri: typeof authServiceBase != 'undefined' ? authServiceBase : 'https://angjobs.com/',
    clientId: 'angjobsApp'
});

app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', 'localStorageServiceProvider', 'CacheFactoryProvider', function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, localStorageServiceProvider, CacheFactoryProvider) {

    Stripe.setPublishableKey('pk_live_UiOp1gWlytAgr4d28YiX83H4');

    $locationProvider.hashPrefix('!');
    //localStorageServiceProvider.setStorageCookie(1, '/');

    angular.extend(CacheFactoryProvider.defaults, { maxAge: 15 * 60 * 1000 });

    //================================================
    // Add an interceptor for AJAX errors
    //================================================
    $httpProvider.interceptors.push('authInterceptorService');

    // TODO this does not work. allow case insensitive urls
    //$urlRouterProvider.rule(function ($injector, $location) {
    //    //what this function returns will be set as the $location.url
    //    var path = $location.path(), normalized = path.toLowerCase();
    //    if (path != normalized) {
    //        //instead of returning a new url string, I'll just change the $location.path directly so I don't have to worry about constructing a new url string and so a new state change is not triggered
    //        $location.replace().path(normalized);
    //    }
    //})

    //================================================
    // Routes
    //================================================

    //////////////////////////
    // State Configurations //
    //////////////////////////

    // Use $stateProvider to configure your states.
    $stateProvider

      //////////
      // Home //
      //////////

      //.state("home", {

      //    // Use a url of "/" to set a state as the "index".
      //    url: "/home",

      //    // Example of an inline template string. By default, templates
      //    // will populate the ui-view within the parent state's template.
      //    // For top level states, like this one, the parent template is
      //    // the index.html file. So this template will be inserted into the
      //    // ui-view within index.html.
      //    templateUrl: 'App/Home',
      //    controller: 'homeCtrl'

      //})
      .state("home", {
            url: "/home",
            templateUrl: 'App/HotJobs',
            resolve: {
                hotlist: ['jobs',
                 function (jobs) {
                     return jobs.hot();
                 }]
            },
            controller: 'hotCtrl'
        })
     .state("postjob", {
         url: "/postjob",
         templateUrl: 'App/PostJob',
         controller: 'postJobCtrl'
     })
    .state("about", {
        url: "/about",
        templateUrl: 'App/About',
        controller: 'aboutCtrl'
    })
    .state("testimonials", {
        url: "/testimonials",
        templateUrl: 'App/Testimonials',
        controller: 'testimonialsCtrl'
    })
    .state("pay", {
        url: "/pay",
        templateUrl: 'App/Pay',
        controller: 'payCtrl'
    })
    .state("payFor", {
        url: "/pay/:type/:email",
        params: {
            email: {
                value: null,
                squash: true
            }
        },
         templateUrl: 'App/Pay',
         controller: 'payCtrl'
    })
        .state("services", {
        url: "/services",
        templateUrl: 'App/Services',
        controller: 'servicesCtrl'
    })
    .state("daily", {
        url: "/daily",
        templateUrl: 'App/Daily',
        controller: 'dailyCtrl'
    })
   .state("byday", {
       url: "/daily/:day",
          templateUrl: 'App/Day',
          controller: 'dailyCtrl'
      })
    .state("employer", {
        url: "/employer",
        resolve: {
            todaysJobApplications: ['$cookies','jobs',
            function ($cookies,jobs) {
                return jobs.getTodaysJobApplicationsForRecruiter($cookies.guid);
            }]
        },
        views: {
            '': {
                templateUrl: 'App/Employer',
                controller:  ['$scope', 'todaysJobApplications', function ($scope,todaysJobApplications) {
                    $scope.todaysJobApplications = todaysJobApplications;
                }]
            },
            'dashboardTitle@employer': {
                template: '',
                controller: function ($scope) {
                }
            },
            'leftSideMenu': {
                templateUrl: 'App/EmployerLeftSideMenu',
                controller: function ($scope) {
                }
            }
        }
    })
     .state("developer", {
         url: "/developer",
         resolve: {
             todaysJobApplications: ['$cookies', 'jobs',
             function ($cookies, jobs) {
                 return jobs.getTodaysJobApplicationsForRecruiter($cookies.guid);
             }]
         },
         views: {
             '': {
                 templateUrl: 'App/Employer',
                 controller: ['$scope', 'todaysJobApplications', function ($scope, todaysJobApplications) {
                     $scope.todaysJobApplications = todaysJobApplications;
                 }]
             },
             'dashboardTitle@developer': {
                 template: '',
                 controller: function ($scope) {
                 }
             },
             'leftSideMenu': {
                 templateUrl: 'App/EmployerLeftSideMenu',
                 controller: function ($scope) {
                 }
             }
         }
     })

    $urlRouterProvider.when('/', '/home');

    $urlRouterProvider.otherwise('/home');

}]);

app.run(['$http', '$cookies', '$cookieStore', 'authService', '$rootScope', '$state', '$stateParams', '$log',
    function ($http, $cookies, $cookieStore, authService, $rootScope, $state, $stateParams, $log) {
    
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
    $rootScope.$log = $log;

    authService.fillAuthData();

    //If a token exists in the cookie, load it after the app is loaded, so that the application can maintain the authenticated state.
    $http.defaults.headers.common.Authorization = 'Bearer ' + $cookieStore.get('_Token');

    $rootScope.previousState;
    $rootScope.previousStateParams;
    $rootScope.tempState;
    $rootScope.tempStateParams;
    $rootScope.currentState;

    $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
        $rootScope.previousState = from;
        $rootScope.previousStateParams = fromParams;
        $rootScope.currentState = to;

        console.dir('Previous state:' + $rootScope.previousState)
        console.dir('Current state:' + $rootScope.currentState)
    });

}]);


