app.directive('jobLine', function () {
    return {
        restrict: 'EA',
        scope: {
            jobId: '@',
            jobTitle: '@'
        },
        template: "<a class='text-md' ng-repeat='p in jobLine' href='{{p.href}}' ng-attr-target=\"{{ p.href.indexOf('#') == 0 ? undefined :  '_blank' }}\">{{p.text}} </a> ",
        controller: 'jobLineCtrl'
    };
}).controller('jobLineCtrl', ['$scope', function ($scope, $element, $attrs) {
    var links = new Array();
   
    var firstLinkIndex = $scope.jobTitle.indexOf('<a');
    if (firstLinkIndex > -1) {
        var link1 = $scope.jobTitle.substring(0, firstLinkIndex);
        links.push(new Line(link1, '#!/jobdetails/' + $scope.jobId));

        var firstEndLinkIndex = $scope.jobTitle.indexOf('</a') +4;
        var link2 =  $($scope.jobTitle.substring(firstLinkIndex, firstEndLinkIndex))[0];
        links.push(new Line(link2.innerText.replace("http://", "").replace("https://", ""), link2.href));

        var link3 = $scope.jobTitle.substring(firstEndLinkIndex);
        links.push(new Line(link3, '#!/jobdetails/' + $scope.jobId));

    }
    else
    {
        links.push(new Line($scope.jobTitle, '#!/jobdetails/' + $scope.jobId));
    }
    $scope.jobLine = links;

    function Line(text, href)
    {
        this.text = text;
        this.href = href;
    }
}]);