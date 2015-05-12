var app = angular.module('app', [
    'ui.router',
    'ngCookies',
    'home',
    'signIn',
    'register',
    'todoManager'
]);




app.config(['$provide', '$urlRouterProvider', '$httpProvider', '$stateProvider', function ($provide, $urlRouterProvider, $httpProvider, $stateProvider) {
    
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
          templateUrl: 'App/Home',
          
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

    $urlRouterProvider.when('/', '/home');

    $urlRouterProvider.otherwise('/home');

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

