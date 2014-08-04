'use strict';

/* Controllers */

angular.module('iBoard.controllers', [])
    .controller('HomeCtrl', ['$scope', 'Idea', 'User', 'Suggest', function ($scope, Idea, User, Suggest) {
        $scope.ideas = [];
        $scope.loginUser = AV.User.current();
        $scope.likesCount = [];

        $scope.suggestOptions = [
            {name: "已经被实现", value: "done"},
            {name: "我正在实现", value: "doing"}
        ];
        $scope.suggestData = {};
        $scope.suggestTargetIdea = "";

        Idea.getAllIdeas(function (_ideas) {
            $scope.$apply(function () {
                $scope.ideas = _ideas;
                angular.forEach(_ideas, function (idea, index) {
                    $scope.ideas[index].createdAt = new Date($scope.ideas[index].createdAt).toDateString();
                    User.findUserById($scope.ideas[index].attributes.publisher.id, function (user) {
                        $scope.$apply(function () {
                            $scope.ideas[index].publisher = user.attributes.username;
                        })
                    }, function (obj, err) {
                        $scope.$apply(function () {
                            $scope.errors = err.message;
                        })
                    });

                    Idea.getAllLikedUsers(idea, function (users) {
                        $scope.$apply(function () {
                            $scope.likesCount[index] = users.length;
                        })
                    }, function (err) {
                        $scope.$apply(function () {
                            $scope.errors = err;
                        });
                    })
                });

                $('.carousel').carousel({
                    interval: 5000
                })
            })
        }, function (_ideas, err) {
            $scope.$apply(function () {
                $scope.errors = err.message;
            })
        });

        $scope.go = function (dest) {
            $('.carousel').carousel(dest);
        };

        $scope.isSelf = function (publisherId) {
            return AV.User.current() && publisherId == AV.User.current().id;
        };

        $scope.like = function (idea) {
            User.like(idea, function (err) {
                $scope.errors = err.message;
            })
        };

        $scope.setSuggestTargetIdea = function (ideaId) {
            $scope.suggestTargetIdea = ideaId;
        };
        $scope.suggest = function () {
            $scope.suggestData.ideaId = $scope.suggestTargetIdea;
            console.log($scope.suggestData);
            Suggest.create($scope.suggestData, function (_suggest) {
                $scope.$apply(function () {
                    $scope.suggestData = $scope.suggestTargetIdea = {};
                    $("#suggestIdea").modal('hide');
                })
            }, function (err) {
                $scope.$apply(function () {
                    $scope.errors.other = err;
                })
            })
        }
        $scope.currentTab = 1;
        $scope.tabSwitch = function (tabNo) {
            if ($scope.currentTab != tabNo) {
                $("#tabNav").children("li").toggleClass("active");
                $scope.currentTab = tabNo;
            }
        }
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
                        $scope.errors.other = err.description;
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
    .controller('CenterCtrl', ['$scope', 'Idea', 'User', function ($scope, Idea, User) {
        $scope.ideas = [];
        $scope.likes = [];
        $scope.errors = {}

        var loadIdeas = function () {
            Idea.getUserIdeas(function (_ideas) {
                $scope.$apply(function () {
                    $scope.ideas = _ideas;
                    for (var i = 0; i < $scope.ideas.length; i++)
                        $scope.ideas[i].createdAt = new Date($scope.ideas[i].createdAt).toDateString();
                })
            }, function (_ideas, err) {
                console.log(err);
                $scope.errors = err;
            })
        };
        loadIdeas();

        User.getAllLikedIdeas(function (_likes) {
            $scope.$apply(function () {
                $scope.likes = _likes;
            })
        }, function (likes, err) {
            $scope.$apply(function () {
                $scope.errors = err;
            })
        });

        $scope.delete = function (ideaId) {
            Idea.deleteIdea(ideaId, function (idea) {
                console.log("Ideas<%s> has been deleted.", idea.objectId);
                loadIdeas();
            }, function (err) {
                $scope.errors = err;
            })
        };
    }])
    .controller('NavbarCtrl', ['$scope', '$location', 'User', 'Idea', function ($scope, $location, User, Idea) {
        $scope.loginUser = AV.User.current();
        $scope.username = $scope.loginUser ? $scope.loginUser.attributes.username : null;
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

        $scope.enterCenter = function () {
            $location.path('/center/' + $scope.loginUser.attributes.username);
        };

        $scope.logout = function () {
            User.logout(function () {
                $location.path('/');
            }, function () {
                console.log("Invalid logout request!");
            })
        };
    }]);
