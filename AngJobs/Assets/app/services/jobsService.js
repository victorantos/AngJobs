angular.module('jobs.service', [

])

// A RESTful factory for retrieving jobs 
.factory('jobs', ['$http', 'CacheFactory', function ($http, CacheFactory) {
    var path = '/api/Jobs/GetJobsList';
    var hotPath = '/api/Jobs/GetHotJobs';

    if (!CacheFactory.get('dailyJobsCache')) {
        // or CacheFactory('dailyJobsCache', { ... });
        CacheFactory.createCache('dailyJobsCache', {
            deleteOnExpire: 'aggressive',
            recycleFreq: 15*60000
        });
    }

    var hotJobs = $http.get(hotPath, {
        params: { maxJobs: 15 }
    }
    ).then(function (resp) {
        return resp.data;
    });

    var jobs = $http.get(path).then(function (resp) {
        return resp.data;
    });

    var factory = {};
    factory.hot = function () {
        return hotJobs;
    };
    factory.all = function () {
        return jobs;
    };
     
    factory.getHNJobs = function () {
        var list = $http.get('/api/Jobs/GetHackerNewsJobs')
            .then(function (resp) {
            return resp.data;
        });
        return list;
    }

    factory.byRecruiter = function (recruiterId) {
        var list = $http.get('/api/Jobs/GetJobsByRecruiter', {
            params: { id: recruiterId }
        }).then(function (resp) {
            return resp.data;
        })
        return list;
    };

    factory.getJobApplicationsForRecruiter = function (recruiterId) {
        var ja = $http.get('/api/Jobs/GetDailyJobApplicationsForRecruiter', {
            params: { id: recruiterId }
        }).then(function (resp) {
            return resp.data;
        })

        return ja;
    };
    factory.getTodaysJobApplicationsForRecruiter = function (recruiterId) {
        var ja = $http.get('/api/Jobs/GetTodaysJobApplicationsForRecruiter', {
            params: { id: recruiterId }
        }).then(function (resp) {
            return resp.data;
        })

        return ja;
    };
    factory.getJobApplication = function (id) {
        var ja = $http.get('/api/Jobs/GetJobApplication', {
            params: { id: id }
        }).then(function (resp) {
            return resp.data;
        })

        return ja;
    };
    factory.get = function (jobId) {
        var path = '/api/Jobs/GetJobDetails';
        var detail = $http.get(path, {
            params: { id: jobId }
        }).then(function (resp) {
            return resp.data;
        })
        return detail;
    };

    var dailyJobsCache = CacheFactory.get('dailyJobsCache');

    factory.getDailyJobs = function (day) {
       var dailyjobs = $http.get('/api/Jobs/GetDailyJobs', {
           params: { day: day },
           cache: dailyJobsCache
        }).then(function (resp) {
            return resp.data;
        });

       return dailyjobs;
    }
    return factory;
}]);