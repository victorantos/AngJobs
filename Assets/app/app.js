var app = angular.module('app', [
    'ui.router',
    'ngResource',
    'ngCookies',
    'home',
     'contracts',
      'inbox',
       'permanent',
        'about',
        'employers',
         'developers',
    'signIn',
    'register',
   'jobs.resource'
]);




app.config(['$provide', '$urlRouterProvider', '$httpProvider', '$stateProvider', function ($provide, $urlRouterProvider, $httpProvider, $stateProvider) {
    
    //================================================
    // Routes
    //================================================

    $urlRouterProvider.when('/', '/home');



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
          templateUrl: 'App/Home',
          resolve: {
              jobsResource: 'jobsResource',
              jobsList: function (jobsResource) {
                  return jobsResource.query();
              }
          },
          controller: 'homeCtrl'
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
   .state("inbox", {
       url: "/inbox",
       templateUrl: 'App/Inbox',
       controller: 'inboxCtrl'
   })
    .state("contracts", {
        url: "/contracts",
        templateUrl: 'App/Contracts',
        controller: 'contractsCtrl'
    })
    .state("permanent", {
        url: "/permanent",
        templateUrl: 'App/Permanent',
        controller: 'permanentCtrl'
    })
    .state("employers", {
        url: "/employers",
        templateUrl: 'App/Employers',
        controller: 'employersCtrl'
    })
     .state("developers", {
         url: "/developers",
         templateUrl: 'App/Developers',
         controller: 'developersCtrl'
     })
    
    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("home");
    })

}]);

//GLOBAL FUNCTIONS - pretty much a root/global controller.
//Get username on each page
//Get updated token on page change.
//Logout available on each page.
app.run(['$rootScope', '$http', '$cookies', '$cookieStore', function ($rootScope, $http, $cookies, $cookieStore) {

    $rootScope.previousState;
    $rootScope.currentState;

    $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
        $rootScope.previousState = from;
        $rootScope.currentState = to;
        console.dir('Previous state:' + $rootScope.previousState)
        console.dir('Current state:' + $rootScope.currentState)
    });
   
}]);

