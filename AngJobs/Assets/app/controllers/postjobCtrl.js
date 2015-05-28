angular.module('postJob', ['textAngular'])
    .controller('postJobCtrl', ['$scope', '$http', '$location', '$cookies', function ($scope, $http, $location, $cookies) {
        $scope.jobPost = {
            //htmlContent: 'Click here...'
        };

        $scope.saveJob = function () {
            var expiresOn = $scope.jobPost.expiresOn;
            if (expiresOn) {
                if (moment(expiresOn, 'MM/DD').isValid())
                    expiresOn = moment(expiresOn, 'MM/DD');
                else if (moment(expiresOn, 'YYYY/MM/DD').isValid())
                    expiresOn = moment(expiresOn, 'YYYY/MM/DD');

                // add year if needed
                if (moment().diff(expiresOn, "days") > 0)
                    expiresOn = expiresOn.add(1, 'year');
            }
            item =
                {
                    jobTitle: $scope.jobPost.jobTitle,
                    jobType: $scope.jobPost.jobType,
                    jobDescription: $scope.jobPost.htmlContent,
                    jobEmail: $scope.jobPost.jobEmail,
                    jobLocation: $scope.jobPost.jobLocation,
                    hiringCompany: $scope.jobPost.hiringCompany,
                    hiringCompanyWebsite: $scope.jobPost.hiringCompanyWebsite,
                    salaryMin: $scope.jobPost.salaryMin,
                    salaryMax: $scope.jobPost.salaryMax,
                    salaryType: $scope.jobPost.salaryType,
                    currency: $scope.jobPost.currency,
                    expiresOn: expiresOn
                };

            if ($scope.jobPost.jobTitle != '') {
                $http.post('/api/Jobs/PostJob', item)
                    .success(function (data, status, headers, config) {
                        $scope.jobPost.jobTitle = '';
                        //redirect to list?
                        // $scope.getList();

                        $location.path('/jobdetails/' + data.Id);

                        // store cookie 
                        $cookies.guid = data.CreatedBy;
                    });
            }
        }
    }]);