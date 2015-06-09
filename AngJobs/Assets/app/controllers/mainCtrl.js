angular.module('main', ['ngCookies', 'ui.router'])
    .controller('mainCtrl', ['$scope', '$rootScope', '$state', '$http', '$cookies', '$cookieStore', '$location', '$stateParams', 'localStorageService', 'authService',
        function ($scope, $rootScope, $state, $http, $cookies, $cookieStore, $location, $stateParams, localStorageService, authService) {
        var dateFormat = "YYYY-MM-DD";
        $scope.query = '';
        $scope.searchByTemp = {};
        $scope.filter = {
            myNewFilter: ''
        };
        //$scope.today = new moment().format(dateFormat);
        //$scope.yesterday = new moment($scope.today).add('days', -1).format(dateFormat);

        if (localStorageService.get('myFilters') == null)
            $scope.filter.myNewFilter = 'python';
        $scope.myFilters = localStorageService.get('myFilters') || [];
        $scope.addFilter = function () {

            if ($scope.filter.myNewFilter != null && $scope.filter.myNewFilter != '') {
                var newFilter = encodeURIComponent($scope.filter.myNewFilter);

                if ($scope.myFilters.indexOf(newFilter) == -1) {
                    $scope.myFilters.push(newFilter);
                    localStorageService.set('myFilters', $scope.myFilters);
                    $scope.filter.myNewFilter = '';
                    window.location = '#!/jobs/filter/' + newFilter;
                    
                }
            }
        }
        $scope.decodeUriComponent = function (c) {
            return decodeURIComponent(c);
        }
        $scope.removeFilter = function (index) {
            console.log('remove filter: %s', index);
            $scope.myFilters.splice(index, 1);
            localStorageService.set('myFilters', $scope.myFilters);
            window.location = '#!/jobs/inbox';
        }
        
        Object.defineProperty($scope, 'searchBy', {
            get: function () {
                return $scope.query ? $scope.query : $scope.searchByTemp;
            },
            set: function (newValue) {
                if (typeof (newValue) == "object") {
                    $scope.query = '';
                    $scope.searchByTemp = newValue;
                }
            }
        });
 
        $scope.$on('$locationChangeSuccess', function (event) {
            //possiblity of updating token on this request.  This could be the keepalive function.
            // $scope.getUserName();

            $scope.activePath = $location.path();
        });

        $scope.logOut = function () {
            authService.logOut();
            $location.path('/home');
        }

        $scope.authentication = authService.authentication;

    }]);
   
 