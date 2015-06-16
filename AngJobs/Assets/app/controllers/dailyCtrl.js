angular.module('daily', [])
    .controller('dailyCtrl', ['$scope', '$http', '$stateParams', 'jobs', function ($scope, $http, $stateParams, jobs) {

        var dayFormat = "YYYY-MM-DD";
        $scope.day = null;

        if ($stateParams.day)
        {
            var d = moment($stateParams.day,dayFormat );
            if (d.isValid())
                $scope.day = d;
            console.dir($scope.day);
        }
        if ($scope.day)
        {

        }
        else
        {
           
         
        }

       
        jobs.getDailyJobs($scope.day ? $scope.day.format(dayFormat): null).then(function (data) {
            $scope.dailyJobs = data;
        });

    }])
  .filter('keys', function () {
      return function (input) {
          if (!input) {
              return [];
          }
          return Object.keys(input);
      }
  });
         