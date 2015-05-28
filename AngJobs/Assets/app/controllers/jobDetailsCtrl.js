angular.module('jobDetails', ['ngSanitize', 'ui.router'])
    .config(['$stateProvider', '$urlRouterProvider', 
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
            .state('jobdetails', {
                url: '/jobdetails/:jobId',
                resolve: {
                    jobsResource: 'jobsResource',
                    jobdetail: function (jobsResource, $stateParams) {

                        // Extract customer ID from $stateParams
                        var jobId = $stateParams.jobId;

                        // Return a promise to make sure the customer is completely
                        // resolved before the controller is instantiated
                        return jobsResource.get({ jobId: jobId }).$promise;
                    }
                },
                templateUrl: 'App/JobDetails',
                controller: ['$scope', '$rootScope', '$http', '$location', '$state', 'jobdetail', 'utils', '$cookies',
                    function ($scope, $rootScope, $http, $location, $state, jobdetail, utils, $cookies) { 
                        $scope.details = jobdetail;
                        $scope.applicant = {};
                        $scope.details.currencyIconCss = null;
                        $scope.salary = function () {
                            var currency = "£";
                            switch ($scope.details.currency) {
                                case utils.CurrencyType.Euro:
                                    currency = "eur"; //eur sign
                                      $scope.details.currencyIconCss = "fa fa-euro";
                                    break;
                                case utils.CurrencyType.Usd:
                                    currency = "$";
                                    break;
                                default:
                            }
                            var salary = '';
                            var salaryMin = $scope.details.salaryMin;
                            var salaryMax = $scope.details.salaryMax;

                            if ($scope.details.currencyIconCss != null)
                                currency = '';
                            if (salaryMax && salaryMin)
                                salary += currency + salaryMin + " - "+currency + salaryMax;
                            else {
                                if (salaryMin)
                                    salary += currency + salaryMin;
                                else
                                    salary += currency + salaryMax;
                            }

                            if ($scope.details.salaryType)
                                salary += ' per ' + $scope.details.salaryType;

                            return salary;
                        }

                        $scope.attachedCvId = null;

                        $scope.applyForJob = function () {
                            item =
                                {
                                    email: $scope.applicant.email,
                                    skills: $scope.applicant.skills,
                                    experience: $scope.applicant.experience,
                                    message: $scope.applicant.message,
                                    jobPostId: $scope.details.id,
                                    cvGuid : $scope.attachedCvId
                                };

                            if ($scope.applicant.email != '') {
                                $http.post('/api/Jobs/ApplyForJob', item)
                                    .success(function (data, status, headers, config) {
                                        // todo redirect to thank you state

                                        $scope.applicant.message = '';
                                        $scope.applied = true;
                                        $scope.apply = false;
                                        $scope.applying = false;

                                        $cookies.guid = data.CreatedBy;
                                    })
                                    .error(function (data, status, headers, config) {
                                        // called asynchronously if an error occurs
                                        // or server returns response with an error status.
                                        $scope.jobApplicationErrors = data;
                                        if(data && data.length)
                                            $scope.jobApplicationError = data[0];
                                        $scope.applying = false;
                                    });
                            }
                        }

                        $scope.$watch('files', function () {
                            $scope.upload($scope.files);
                        });
                        $scope.log = '';

                        $scope.upload = function (files) {
                            if (files) {
                                $scope.showAttachCV = true;
                            }
                            if (files && files.length) {
                                for (var i = 0; i < files.length; i++) {
                                    var file = files[i];
                                    Upload.upload({
                                        url: '/api/cv/post',
                                        fields: {
                                            'username': $scope.username
                                        },
                                        file: file
                                    }).progress(function (evt) {
                                        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                                        $scope.log = 'progress: ' + progressPercentage + '% ' +
                                                    evt.config.file.name + '\n' + $scope.log;
                                    }).success(function (data, status, headers, config) {
                                        $scope.log = config.file.name;
                                        $scope.attachedCvId = data.Cvs.length ? data.Cvs[0].Id : null;
                                    });
                                }
                            }
                        };

                        $scope.jobApplicationErrors = [];
                        $scope.jobApplicationError = null;

                        $rootScope.pageTitle = $scope.details.jobTitle + ' - AngularJs job';

                        $scope.goBack = function () {
                            if ($rootScope.previousState == null || $rootScope.previousState.name == '' )
                                location.href = '/#/jobs/inbox';
                            else
                                $rootScope.$state.transitionTo($rootScope.previousState.name, $rootScope.$stateParams);
                        }
                    }
                ]
            })
            .state('jobdetails.linkedin', {
                url: '/signup/LinkedIn',
                templateUrl: '/Assets/app/views/associate.html',
                controller: ['$scope', '$rootScope','$location', '$timeout', 'authService' , 
                    function ($scope, $rootScope, $location, $timeout, authService) {

                    $scope.savedSuccessfully = false;
                    $scope.message = "";

                    $scope.registerData = {
                        userName: authService.externalAuthData.userName,
                        provider: authService.externalAuthData.provider,
                        externalAccessToken: authService.externalAuthData.externalAccessToken
                    };

                    $scope.registerExternal = function () {

                        authService.registerExternal($scope.registerData).then(function (response) {

                            $scope.savedSuccessfully = true;
                            $scope.message = "User has been registered successfully, you can now apply for jobs using your LinkedIn profile, wait 2 seconds.";
                            startTimer();
                        },
                          function (response) {
                              var errors = [];
                              for (var key in response.modelState) {
                                  errors.push(response.modelState[key]);
                              }
                              $scope.message = "Failed to register user due to:" + errors.join(' ');
                          });
                    };

                    var startTimer = function () {
                        var timer = $timeout(function () {
                            $timeout.cancel(timer);
                            console.log('authService.externalAuthData.provider %s', authService.externalAuthData.provider);
                            $location.path('/jobdetails/' + $rootScope.$stateParams.jobId + '/apply/' + authService.externalAuthData.provider);
                        }, 1500);
                    }
                }]
            })
            //.state('jobdetails.apply', {
            //    url: '/apply',
            //    template: ' ',
            //    controller: ['$scope', '$location', '$timeout', 'authService',
            //        function ($scope, $location, $timeout, authService) {
            //            $scope.$parent.apply = true;
            //        }]
            //})
            .state('jobdetails.apply', {
                url: '/apply/LinkedIn',
                templateUrl: 'App/JobApplyLinkedIn',
                controller: ['$scope', '$location', '$timeout', 'authService' , 
                    function ($scope, $location, $timeout, authService){
                        $scope.userProfile = authService.authentication.userProfile;
                        $scope.resume = '';

                        if ($scope.userProfile && $scope.userProfile.positions && $scope.userProfile.positions._total > 0) {
                            var cv = '';
                            var pos = $scope.userProfile.positions.values;
                            var totalExperienceMonths = 0;
                            var totalJobs = pos.length;
                            var query = 'ngular';
                            var countAngular = $scope.userProfile.headline.indexOf(query) >= 0 ? 1 : 0;


                            for (var i = 0; i < pos.length; i++) {
                                if (i == 0)
                                {
                                    cv += getTopLine($scope.userProfile.formattedName, $scope.userProfile.headline, $scope.userProfile.location.name);
                                    cv += '<dl>';
                                }
                                 
                                cv += '<dt>';
                                var duration = getJobDurationMonths(pos[i].startDate, pos[i].endDate);
                                var subTitle = '<i>' + duration + ' months(' + pos[i].startDate.year + ') at ' + pos[i].company.name + '</i>';

                                cv += pos[i].title + ' <span class="label bg-light">' + subTitle + '</span>';
                                cv += '</dt><dd>';
                                cv += pos[i].summary ? pos[i].summary.replace("\n", "<br/>") : '';
                                cv += '</dd>'

                                if(pos[i].title && pos[i].title.indexOf(query) >= 0 || pos[i].summary && pos[i].summary.indexOf(query) >= 0)
                                    countAngular +=1;

                                totalExperienceMonths += duration;
                                if (i == pos.length - 1) {
                                    cv += '</dl>';
                                    cv += getBottomLine(totalJobs, totalExperienceMonths, countAngular);
                                }
                            }

                            if (cv != '') {
                                $scope.resume = cv;
                                $scope.$parent.richEdit = true;
                            }

                        }
                        //we have no longer access to full profile so compose a simple application message
                        if ($scope.resume == '') {
                            var cv = '';
                            cv += 'Hi,<br/>'
                            cv += '<p>I would like to apply for this position. I am currently working as<br/>';
                            cv += '<b>' + $scope.userProfile.headline + '</b>.</p>';
                            cv += 'Thank you!<br/>';
                            cv += $scope.userProfile.formattedName;
                            $scope.resume = cv;
                            $scope.$parent.richEdit = true;
                        }

                        var currentMessage = $scope.$parent.applicant.message;
                        $scope.$parent.applicant.message = (currentMessage ? currentMessage: '') + $scope.resume;

                        $scope.$parent.applicant.email =  $scope.userProfile.formattedName ? $scope.userProfile.formattedName + ' (' + $scope.userProfile.emailAddress + ')' : $scope.userProfile.emailAddress;

                        function getTopLine(name, headline, location) {

                            headline = headline ? ' -- ' + headline : '';
                            location = location ? location : '';

                            return '<p><b>' + name + headline + '</b><br/>'+ location +'<hr/></p>';
                        }
                        function getBottomLine(totalJobs, totalExperienceMonths, countAngular)
                        {
                            countAngular = countAngular ? countAngular : 0;
                            var line = '';
                            var line2 = '';
                            var yearsExperience = Math.floor(totalExperienceMonths / 12);
                            var remainderExperience = totalExperienceMonths % 12;
                            var experienceLine = '';
                            if(yearsExperience == 0)
                                experienceLine = remainderExperience + ' months';
                            else
                            {
                                yearsExperience += remainderExperience > 5 ? 1 : -1;
                                experienceLine = yearsExperience + ' years';
                            }
                            
                            line += '<p><b>Total:</b> ' + totalJobs + ' jobs and about ' + experienceLine + ' experience.</p>';
                            line2 = countAngular == 0 ? '' :
                                '<p><b>AngularJs:</b> used at ' + countAngular + ' job' + (countAngular > 1 ? 's':'') + '.</p>';
                            var line3 = '<p><hr/>' + moment().format('ddd D MMM YYYY hh:mm') + '</p>';
                            // removed line 2
                            return line + line3;
                        }
                        function getJobDurationMonths(startDate, endDate) {
                            var start = moment((startDate.month ? startDate.month : 1) + '/' + startDate.year, "MM/YYYY");
                            var end = null;
                            if (endDate == null)
                                end = moment();
                            else
                                end = moment((endDate.month ? endDate.month : 1) + '/' + endDate.year, "MM/YYYY");
                            return end.diff(start, 'months');
                        }

                    }
                ]
            })
            .state('jobdetails.github', {
                url: '/apply/GitHub',
                templateUrl: 'App/JobApplyGitHub',
                controller: ['$scope', '$location', '$timeout', 'authService',
                    function ($scope, $location, $timeout, authService) {
                        $scope.githubUserProfile = authService.authentication.githubUserProfile;
                        $scope.$parent.applicant.email = $scope.githubUserProfile.name ? $scope.githubUserProfile.name + ' (' + $scope.githubUserProfile.email + ')' : $scope.githubUserProfile.email;
                    }
                ]
            })
            .state('jobdetails.twitter', {
                 url: '/apply/Twitter',
                 templateUrl: 'App/JobApplyTwitter',
                 controller: ['$scope', '$location', '$timeout', 'authService',
                     function ($scope, $location, $timeout, authService) {
                         $scope.twitterUserProfile = authService.authentication.githubUserProfile;
                         $scope.$parent.applicant.email = $scope.twitterUserProfile.name ? $scope.twitterUserProfile.name + ' (' + $scope.twitterUserProfile.email + ')' : $scope.twitterUserProfile.email;
                     }
                 ]
             })
            .state('jobdetails.stackexchange', {
                url: '/apply/StackExchange',
                templateUrl: 'App/JobApplyStackExchange',
                controller: ['$scope', '$location', '$timeout', 'authService',
                    function ($scope, $location, $timeout, authService) {
                        $scope.stackexchangeUserProfile = authService.authentication.stackexchangeUserProfile;
                    }
                ]
            })
        }
    ])
   .directive("contenteditable", function () {
    return {
        restrict: "A",
        require: "ngModel",
        link: function (scope, element, attrs, ngModel) {

            function read() {
                ngModel.$setViewValue(element.html());
            }

            ngModel.$render = function () {
                element.html(ngModel.$viewValue || "");
            };

            element.bind("blur keyup change", function () {
                scope.$apply(read);
            });
        }
    };
});
 