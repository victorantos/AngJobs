angular.module('employer.service', [

])

// A RESTful factory for retrieving jobs 
.factory('employer', ['$http', 'CacheFactory', function ($http, CacheFactory) {
    var path = '/api/Employer/GetSeekingWork';
    
    if (!CacheFactory.get('seekingWorkCache')) {
       
        CacheFactory.createCache('seekingWorkCache', {
            deleteOnExpire: 'aggressive',
            recycleFreq: 15*60000
        });
    }
    var seekingWorkCache = CacheFactory.get('seekingWorkCache');
    var factory = {};

    factory.getFreelancers = function (day) {
        var freelancers = $http.get(path, {
            cache: seekingWorkCache
        }).then(function (resp) {
            return resp.data;
        });

        return freelancers;
    }
    return factory;
}]);