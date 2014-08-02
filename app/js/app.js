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
                controller: 'HomeCtrl'
            }).when('/login', {
                templateUrl: 'partials/login.html',
                controller: 'LoginCtrl'
            }).when('/register', {
                templateUrl: 'partials/register.html',
                controller: 'RegisterCtrl'
            }).when('/center', {
                templateUrl: 'partials/center.html',
                controller: 'CenterCtrl'
            }).otherwise({redirectTo: '/'});
    }]);
