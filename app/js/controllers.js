'use strict';

/* Controllers */

angular.module('iBoard.controllers', [])
    .controller('HomeCtrl', ['$scope', '$location', '$q', 'Idea', 'User', function ($scope, $location, $q, Idea, User) {
        $scope.user = {};
        $scope.submitted = false;
        $scope.errors = {hasRegisterErr: false, registerErr: "",
            hasLoginErr: false, loginErr: ""};
        $scope.loginUser = AV.User.current();

        $scope.ideas = [];
        var deferred = $q.defer();
        var ideasResourcePromise = deferred.promise;

        $scope.register = function (form) {
            $scope.submitted = true;
            if (form.$valid) {
                var data = {};
                data.username = $scope.user.username;
                var regex = new Object();
                regex.email = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
                if (regex.email.test($scope.user.email)) {
                    data.email = $scope.user.email.toLocaleLowerCase();
                }
                data.password = $scope.user.password;

                User.register(data, function (user) {
                    // Resolve digest Cycle
                    $scope.$apply(function () {
                        $location.path('/center');
                    })
                }, function (err) {
                    console.log('get error : ' + angular.toJson(err));
                    $scope.$apply(function () {
                        $scope.errors.hasRegisterErr = true;
                        $scope.errors.registerErr = err.message;
                    })
                })
            }
        };

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
                        $location.path('/center');
                    })
                }, function (err) {
                    $scope.$apply(function () {
                        $scope.errors.hasLoginErr = true;
                        $scope.errors.loginErr = err.message;
                    })
                })
            }
        };

        Idea.getAllIdeas(function (_ideas) {
            $scope.$apply(function () {
                $scope.ideas = _ideas;
                deferred.resolve(_ideas);
                $('.carousel').carousel({
                    interval: 5000
                })
            })
        }, function (_ideas, err) {
            $scope.$apply(function () {
                $scope.errors = err.message;
                deferred.reject();
            })
        });

        ideasResourcePromise.then(function (_ideas) {
            angular.forEach(_ideas, function (idea, index) {
                $scope.ideas[index].createdAt = new Date($scope.ideas[index].createdAt).toDateString();
            });
        });

        $scope.go = function (dest) {
            $('.carousel').carousel(dest);
        };

        $scope.currentTab = 1;
        $scope.tabSwitch = function (tabNo) {
            if ($scope.currentTab != tabNo) {
                $("#tabNav").children("li").toggleClass("active");
                $scope.currentTab = tabNo;
            }
        };

        $scope.autoSlide = function () {
            setInterval(function(){
                $scope.go('next');
            },3000);
        };
        $scope.autoSlide();
    }])

    .controller('AroundCtrl', ['$scope', '$location', '$q', 'User', 'Idea', 'Suggest', function ($scope, $location, $q, User, Idea, Suggest) {
        $scope.ideas = [];
        $scope.likes = [];
        $scope.errors = {};

        $scope.suggestOptions = [
            {name: "已经被实现", value: "已实现"},
            {name: "我正在实现", value: "实现中"}
        ];
        $scope.suggestData = {};
        $scope.suggestTargetIdea = "";

        var deferred = $q.defer();
        var ideasResourcePromise = deferred.promise;

        Idea.getAllIdeas(function (_ideas) {
            $scope.$apply(function () {
                $scope.ideas = _ideas;
                deferred.resolve(_ideas);
            })
        }, function (_ideas, err) {
            $scope.$apply(function () {
                $scope.errors = err.message;
                deferred.reject();
            })
        });

        $scope.isSelf = function (publisherId) {
            return AV.User.current() && publisherId == AV.User.current().id;
        };
        var disableLikeButton = function (likedUsers) {
            if (!AV.User.current())
                return false;
            for (var i = 0; i < likedUsers.length; i++) {
                if (likedUsers[i].id == AV.User.current().id)
                    return true;
            }
            return false;
        };
        ideasResourcePromise.then(function (_ideas) {
            angular.forEach(_ideas, function (idea, index) {
                $scope.ideas[index].createdAt = new Date($scope.ideas[index].createdAt).toDateString();

                Idea.getAllLikedUsers(idea, function (users) {
                    $scope.$apply(function () {
                        var disabled = disableLikeButton(users);
                        $scope.likes[index] = {
                            num: users.length,
                            disabled: disabled,
                            label: disabled ? "Liked" : "Like"
                        }
                    })
                }, function (err) {
                    $scope.$apply(function () {
                        $scope.errors = err;
                    });
                })
            });
        });

        $scope.like = function (idea, ideaIndex) {
            $scope.likes[ideaIndex].num++;
            $scope.likes[ideaIndex].disabled = true;
            $scope.likes[ideaIndex].label = 'Liked';
            User.like(idea, function (err) {
                $scope.errors = err.message;
            })
        };

        $scope.setSuggestTargetIdea = function (ideaId) {
            $scope.suggestTargetIdea = ideaId;
        };
        $scope.suggest = function () {
            $scope.suggestData.ideaId = $scope.suggestTargetIdea;
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
        };

        $scope.enterIdea = function (ideaId) {
            $location.path('idea/' + ideaId);
        }
    }])

    .controller('IdeaCtrl', ['$scope', '$routeParams', '$q', 'Idea', 'User', 'Suggest', 'Comment', function ($scope, $routeParams, $q, Idea, User, Suggest, Comment) {
        $scope.idea = {};

        var ideaId = $routeParams.ideaId;
        var deferred = $q.defer();
        var ideaResourcePromise = deferred.promise;
        $scope.errors = {};

        $scope.suggests = [];

        $scope.comments = [];
        $scope.commentContent = "";
        $scope.created = $scope.createSuccess = $scope.createFailure = false;
        var data = {
            ideaId: ideaId
        };

        Idea.getIdeaById(ideaId, function (_idea) {
            $scope.$apply(function () {
                $scope.idea = _idea;
                deferred.resolve();
                $scope.replyToID = $scope.idea.attributes.publisher.id;
                $scope.replyTo = $scope.idea.attributes.publisher.attributes.username;
                $("#makeComment").attr("placeholder", "写下你的想法，告诉"+ $scope.replyTo +"吧！");
            })
        }, function (err) {
            $scope.$apply(function () {
                $scope.errors.ideaErr = err;
                deferred.reject();
            })
        });

        ideaResourcePromise.then(function () {
            $scope.idea.createdAt = new Date($scope.idea.createdAt).toDateString();

            Idea.getAllLikedUsers($scope.idea, function (users) {
                $scope.$apply(function () {
                    $scope.likesCount = users.length;
                })
            }, function (err) {
                $scope.$apply(function () {
                    $scope.errors = err;
                });
            })
        });

        Suggest.getIdeaSuggests(ideaId, function (_suggests) {
            $scope.$apply(function () {
                $scope.suggests = _suggests;
            })
        }, function (err) {
            $scope.$apply(function () {
                $scope.errors = err;
            })
        });

        var loadComments = function () {
            Comment.getIdeaComments(ideaId, function (_comments) {
                $scope.$apply(function () {
                    $scope.comments = _comments;
                })
            }, function (err) {
                $scope.$apply(function () {
                    $scope.errors.commentErr = err;
                })
            });
        };
        loadComments();

        $scope.createComment = function (replyToId) {
            data.content = $scope.commentContent;
            data.replyTo = replyToId;
            Comment.create(data, function (_comment) {
                $scope.$apply(function () {
                    $scope.created = $scope.createSuccess = true;
                    loadComments();
                })
            }, function (err) {
                $scope.$apply(function () {
                    $scope.created = $scope.createFalure = true;
                })
            })
        };

        $scope.likeComment = function (commentId, type) {
            Comment.likedislikeComment(commentId, type, function () {
                //TODO reload the number of likes
            }, function (err) {
                $scope.$apply(function () {
                    $scope.errors.commentErr = err;
                })
            })
        };

        $scope.changeReplyToID = function(newReplyToID, newReplyTo){
            $scope.replyToID = newReplyToID;
            $scope.replyTo = newReplyTo;
            $("#makeComment").attr("placeholder", "写下你的想法，告诉"+ $scope.replyTo +"吧！");
            $("#makeComment").focus();
        };
    }])

    .controller('CenterCtrl', ['$scope', '$location', 'Idea', 'User', function ($scope, $location, Idea, User) {
        $scope.ideas = [];
        $scope.likes = [];
        $scope.errors = {};

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

        $scope.enterIdea = function (ideaId) {
            $location.path('/idea/' + ideaId);
        }
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

        $scope.isActive = function (route) {
            return route === $location.path();
        };

        $scope.door = function (target) {
            $location.path(target);
        };

        $scope.logout = function () {
            User.logout(function () {
                $location.path('/');
            }, function () {
                console.log("Invalid logout request!");
            })
        };
    }]);
