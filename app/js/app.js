'use strict';


// Declare app level module which depends on filters, and services
angular.module('iBoard', [
        'ngRoute',
        'iBoard.filters',
        'iBoard.services',
        'iBoard.directives',
        'iBoard.controllers'
    ]).
    config(['$routeProvider', function ($routeProvider) {

        $routeProvider
            .when('/', {
                templateUrl: 'partials/home.html',
                controller: 'HomeCtrl',
                redirectTo: function (_, path, __) {
                    if (AV.User.current()) {
                        return '/center/' +
                            AV.User.current().attributes.username
                    } else {
                        return path
                    }
                }
            }).when('/around', {
                templateUrl: 'partials/around.html',
                controller: "AroundCtrl"
            }).when('/center/:username', {
                templateUrl: 'partials/center.html',
                controller: 'CenterCtrl',
                redirectTo: function (_, path, __) {
                    if (AV.User.current()) {
                        return path
                    } else {
                        return '/'
                    }
                }
            }).otherwise({redirectTo: '/'});
    }]);
