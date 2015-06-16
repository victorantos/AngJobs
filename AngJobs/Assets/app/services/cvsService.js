angular.module('cvs.service', [

])

// A RESTful factory for retrieving resumes 
.factory('cvs', ['$http', function ($http) {
    var factory = {};
    factory.get = function () {
        var path = '/api/cv/get';
        var allResumes = $http.get(path).then(function (resp) {
            return resp.data;
        })
        return allResumes;
    };
 
    return factory;
}]);