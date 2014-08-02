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
        var redirect = function (path) {
            if (AV.User.current()) {
                return '/'
            } else {
                return path
            }
        };

        $routeProvider
            .when('/', {
                templateUrl: 'partials/home.html',
                controller: 'HomeCtrl'
            }).when('/login', {
                templateUrl: 'partials/login.html',
                controller: 'LoginCtrl',
                redirectTo: function (_, path, __) {
                    return redirect(path)
                }
            }).when('/register', {
                templateUrl: 'partials/register.html',
                controller: 'RegisterCtrl',
                redirectTo: function (_, path, __) {
                    return redirect(path)
                }
            }).when('/center/:username', {
                templateUrl: 'partials/center.html',
                controller: 'CenterCtrl',
                redirectTo: function (_, path, __) {
                    if (AV.User.current()) {
                        return path
                    } else {
                        return '/login'
                    }
                }
            }).otherwise({redirectTo: '/'});
    }]);
