describe('hotCtrl', function () {
    beforeEach(module('hot', ['ngRoute']));
    it('should have location filters', inject(function ($controller) {
        var scope = {},
            ctrl = $controller('hotCtrl', { $scope: scope });
        //scope.locationFilters.length
        // expect(1).toBe(1);

       // expect(scope.greeting).toBeUndefined();
    }));
});

//'