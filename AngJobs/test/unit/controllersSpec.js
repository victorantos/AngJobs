describe('homeCtrl', function () {
    beforeEach(module('home'));
    it('should have sorting order descending', inject(function ($controller) {
        var scope = {},
            jobsList = [];
        ctrl = $controller('homeCtrl', { $scope: scope, 'jobsList': jobsList });
     
        //tODO first make sure we do actually sort the home page jobs list?

        //test for sorting order here
        //scope.locationFilters.length
        // expect(1).toBe(1);
    }));
});

 