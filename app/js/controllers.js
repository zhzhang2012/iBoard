'use strict';

/* Controllers */

angular.module('iBoard.controllers', [])
    .controller('HomeCtrl', ['$scope', '$location', 'User', function ($scope, $location, User) {

    }])
    .controller('LoginCtrl', ['$scope', '$location', 'User', function ($scope, $location, User) {
        $scope.login = function (form) {
            $scope.submitted = true;
            if (form.$valid) {
                var p = new Object();
                p.email = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
                if (p.email.test($scope.user.username)) {
                    $scope.user.username = $scope.user.username.toLocaleLowerCase();
                }
                User.login($scope.user, function (usr) {
                    $scope.$apply(function () {
                        $location.path('/center/' + usr.attributes.username);
                    })
                }, function (err) {
                    $scope.$apply(function () {
                        console.log('get the login error : ' + angular.toJson(err));
                        $scope.errors.other = err.message;
                    })
                })

            }
        }
    }])
    .controller('RegisterCtrl', ['$scope', '$location', 'User', function ($scope, $location, User) {
        $scope.user = {};
        $scope.errors = {};

        $scope.register = function (form) {
            $scope.submitted = true;
            if (form.$valid) {
                var data = {};
                data.username = $scope.user.username;
                var emailRegex = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
                if (emailRegex.test($scope.user.email)) {
                    data.email = $scope.user.email.toLocaleLowerCase();
                }
                data.password = $scope.user.password;

                User.register(data, function (user) {
                    console.log(user);
                    // Resolve digest Cycle
                    $scope.$apply(function () {
                        $location.path('/center/' + user.attributes.username);
                    })
                }, function (err) {
                    console.log('get error : ' + angular.toJson(err));
                    $scope.$apply(function () {
                        $scope.errors.other = err.description;
                    })
                })
            }
        };
    }])
    .controller('CenterCtrl', ['$scope', 'Idea', function ($scope, Idea) {
        $scope.ideas = [];

        var loadIdeas = function () {
            Idea.getAllIdeas(function (_ideas) {
                $scope.$apply(function () {
                    $scope.ideas = _ideas;
                })
            }, function (_ideas, err) {
                console.log(err);
                $scope.errors = err;
            })
        };
        loadIdeas();

        $scope.delete = function (ideaId) {
            Idea.deleteIdea(ideaId, function (idea) {
                console.log("Ideas<%s> has been deleted.", idea.objectId);
                loadIdeas();
            }, function (err) {
                $scope.errors = err;
            })
        };
    }])
    .
    controller('NavbarCtrl', ['$scope', '$location', 'User', 'Idea', function ($scope, $location, User, Idea) {
        $scope.loginUser = AV.User.current();
        $scope.idea = {};
        $scope.errors = {};

        $scope.create = function () {
            if ($scope.loginUser && $scope.idea.content != "") {
                Idea.createIdea($scope.idea, function (idea) {
                    $scope.$apply(function () {
                        console.log("New idea created!");
                        $("#createIdea").modal('hide');
                    })
                }, function (_idea, err) {
                    console.log(err);
                    $scope.errors.other = err;
                })
            }
        };

        $scope.door = function (target) {
            $location.path(target);
        };

        $scope.isActive = function (route) {
            return route === $location.path();
        };

        $scope.logout = function () {
            User.logout(function () {
                $location.path('/');
            }, function () {
                console.log("Invalid logout request!");
            })
        };
    }]);
