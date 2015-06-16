angular.module('pay', ['stripe'])
    .controller('payCtrl', ['$scope', '$http', '$stateParams', function ($scope, $http, $stateParams) {
        $scope.isPaying = false;
        $scope.isOneoffPay = false;
        $scope.isSubscriptionPay = false;
        $scope.hasPaid = false;
        $scope.email = $stateParams.email;
        $scope.hasPaymentFailed = false;

        if ($stateParams.type) {
            if ($stateParams.type == "one-off" || $stateParams.type == "oneoff") {
                $scope.payBtnText = "Pay only £19, one-off payment";
                $scope.isOneoffPay = true;
                $scope.product = "Up to 1000 job applications in 7 to 14 days for just £19 (fixed price)"
            }
            if ($stateParams.type == "subscription") {
                $scope.payBtnText = "Pay £3.99 per month";
                $scope.isSubscriptionPay = true;
                $scope.product = " Up to 100 job applications for you each month for just £3.99/mo (subscription)"
            }
            // console.log($stateParams.type);
        }

        $scope.saveCustomer = function (status, response) {

            if (response.error) {
                $scope.error = response.error;
            } else {
                $scope.isPaying = true;

                response.email = $scope.email;

                if ($scope.isOneoffPay)
                    response.amount = 1900;
                if ($scope.isSubscriptionPay)
                    response.amount = 399;


                $http.post('/api/Payment/SaveCustomer', response)
                    .then(function (response) {
                        // success
                        console.log("Success to pay.")
                        console.dir(response.data);

                        $scope.isPaying = false;

                        if (response.data.validPay) {
                            $scope.hasPaid = true;
                        }
                    },
                function (response) {
                    // failed
                    console.log("Failed to pay.")
                    console.dir(response);

                    $scope.isPaying = false;
                });
            }
        };
    }]);
         