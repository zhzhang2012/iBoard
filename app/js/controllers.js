'use strict';

/* Controllers */

angular.module('iBoard.controllers', [])
    .controller('HomeCtrl', ['$scope', '$location', '$q', 'Idea', 'User', function ($scope, $location, $q, Idea, User) {
        $scope.ideas = [];
        var deferred = $q.defer();
        var ideasResourcePromise = deferred.promise;

        Idea.getFeaturedIdeas(0, 10, function (_ideas) {
            $scope.ideas = _ideas;
            deferred.resolve(_ideas);
            $('.carousel').carousel({
                interval: 5000
            })
        }, function (_ideas, err) {
            $scope.errors = err.message;
            deferred.reject();
        });

        ideasResourcePromise.then(function (_ideas) {
            angular.forEach(_ideas, function (idea, index) {
                $scope.ideas[index].createdAt = new Date($scope.ideas[index].createdAt).toDateString();
            });
        });

        $scope.encode = function (ideaId) {
            return encodeURIComponent("http://127.0.0.1:8000/app/#/idea/" + ideaId);
        };

        $scope.go = function (dest) {
            $('.carousel').carousel(dest);
        };

        $scope.autoSlide = function () {
            setInterval(function () {
                $scope.go('next');
            }, 6000);
        };
        $scope.autoSlide();


    }])

    .controller('ReglogCtrl', ['$scope', '$location', 'User', function ($scope, $location, User) {
        $scope.user = {};
        $scope.submitted = false;
        $scope.errors = {hasRegisterErr: false, registerErr: "",
            hasLoginErr: false, loginErr: ""};
        $scope.loginUser = AV.User.current();

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
                        $('.modal-backdrop').remove();
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
                        $('.modal-backdrop').remove();
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

        $scope.currentTab = 1;
        $scope.tabSwitch = function (tabNo) {
            if ($scope.currentTab != tabNo) {
                $("#tabNav").children("li").toggleClass("active");
                $scope.currentTab = tabNo;
            }
        };
    }])

    .controller('AroundCtrl', ['$scope', '$location', '$q', 'User', 'Idea', 'Suggest', 'ToolsProvider',
        function ($scope, $location, $q, User, Idea, Suggest, ToolsProvider) {
            $scope.ideas = [];
            $scope.tags = ToolsProvider.tagResources();
            $scope.tagLabel = "按Tag筛选";
            //$scope.likes = [];
            $scope.errors = {};

            $scope.suggestOptions = [
                {name: "已经被实现", value: "已实现"},
                {name: "我正在实现", value: "实现中"}
            ];
            $scope.suggestData = {};
            $scope.suggestTargetIdea = "";

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

            $scope.loadIdeas = function (type) {
                var deferred = $q.defer();
                var ideasResourcePromise = deferred.promise;

                Idea.getFeaturedIdeas(type, 10, function (_ideas) {
                    $scope.ideas = _ideas;
                    deferred.resolve(_ideas);
                }, function (_ideas, err) {
                    $scope.errors = err.message;
                    deferred.reject();
                });

                ideasResourcePromise.then(function (_ideas) {
                    angular.forEach(_ideas, function (idea, index) {
                        $scope.ideas[index].createdAt = new Date($scope.ideas[index].createdAt).toDateString();
                        Idea.getAllLikedUsers(idea, function (users) {
                            $scope.$apply(function () {
                                var disabled = disableLikeButton(users);
                                $scope.ideas[index].like.disabled = disabled;
                                $scope.ideas[index].like.label = disabled ? "Liked" : "Like";
                            })
                        }, function (err) {
                            $scope.$apply(function () {
                                $scope.errors = err;
                            });
                        })
                    });
                });
            };
            $scope.loadIdeas(0);

            $scope.filterIdeas = function (tagName) {
                $scope.tagLabel = tagName;
                Idea.filterIdeas(tagName, function (_ideas) {
                    $scope.ideas = _ideas;
                }, function (err) {
                    $scope.errors = err;
                })
            };

            $scope.like = function (idea, ideaIndex) {
                ToolsProvider.checkUserStatus(function (user) {
                    $scope.ideas[ideaIndex].like.num++;
                    $scope.ideas[ideaIndex].like.disabled = true;
                    $scope.ideas[ideaIndex].like.label = 'Liked';
                    User.like(idea, function (err) {
                        $scope.errors = err.message;
                    })
                }, function (err) {
                    $('#reglog').modal('show');
                })
            };

            $scope.setSuggestTargetIdea = function (ideaId) {
                ToolsProvider.checkUserStatus(function (user) {
                    $scope.suggestTargetIdea = ideaId;
                    $('#suggestIdea').modal('show');
                }, function (err) {
                    $('#reglog').modal('show');
                })
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

    .controller('IdeaCtrl', ['$scope', '$location', '$routeParams', '$q', 'Idea', 'User', 'Suggest', 'Comment', 'ToolsProvider',
        function ($scope, $location, $routeParams, $q, Idea, User, Suggest, Comment, ToolsProvider) {
            $scope.idea = {};

            var ideaId = $routeParams.ideaId;
            var deferred = $q.defer();
            var ideaResourcePromise = deferred.promise;
            $scope.errors = {};

            $scope.suggests = [];

            $scope.allComments = $scope.comments = [];
            $scope.commentCategories = ToolsProvider.commentCategories();
            $scope.newComment = {
                ideaId: ideaId
            };
            $scope.replyTo = $scope.replyToID = "";
            $scope.created = $scope.createSuccess = $scope.createFailure = false;

            Idea.getIdeaById(ideaId, function (_idea) {
                $scope.$apply(function () {
                    $scope.idea = _idea;
                    $scope.replyToID = $scope.idea.attributes.publisher.id;
                    $scope.replyTo = $scope.idea.attributes.publisher.attributes.username;
                    //$("#makeComment").attr("placeholder", "写下你的想法，告诉" + $scope.replyTo + "吧！");
                    deferred.resolve();
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
                        $scope.allComments = $scope.comments = _comments;
                    })
                }, function (err) {
                    $scope.$apply(function () {
                        $scope.errors.commentErr = err;
                    })
                });
            };
            loadComments();

            $scope.createComment = function (replyToId) {
                $scope.newComment.replyTo = replyToId;
                Comment.create($scope.newComment, function (_comment) {
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

            $scope.filterComments = function (category) {
                $scope.comments = _.filter($scope.allComments, function (_comment) {
                    return category == _comment.attributes.category;
                })
            };

            $scope.likeComment = function (commentId, commentIndex, type) {
                Comment.likedislikeComment(commentId, type, function () {
                    $scope.$apply(function () {
                        $scope.comments[commentIndex].attributes[type]++;
                    })
                }, function (err) {
                    $scope.$apply(function () {
                        $scope.errors.commentErr = err;
                    })
                })
            };

            $scope.changeReplyToID = function (newReplyToID, newReplyTo) {
                $scope.replyToID = newReplyToID;
                $scope.replyTo = newReplyTo;
                //$("#makeComment").attr("placeholder", "写下你的想法，告诉" + $scope.replyTo + "吧！");
                $("#makeComment").focus();
            };

            $scope.enterApply = function () {
                $location.path('/idea/' + ideaId + '/apply');
            }
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

    .controller('NavbarCtrl', ['$scope', '$location', 'User', 'Idea', 'ToolsProvider', function ($scope, $location, User, Idea, ToolsProvider) {
        $scope.loginUser = AV.User.current();
        $scope.username = $scope.loginUser ? $scope.loginUser.attributes.username : null;
        $scope.idea = {};
        $scope.errors = {};

        $('#ideaTags').tagit({
            fieldName: "ideaTypes",
            allowSpaces: true,
            //showAutocompleteOnFocus: true,
            availableTags: ToolsProvider.tagResources(),
            tagLimit: 5,
            placeholderText: "输入Tag回车添加",
            onTagLimitExceeded: function () {
                $scope.$apply(function () {
                    $scope.errors.hasTagErr = true;
                    $scope.errors.tagErr = "最多只能添加5个Tags";
                })
            }
        });

        $scope.create = function () {
            var tagsInputs = document.getElementsByName('ideaTypes');
            $scope.idea.tags = [];
            for (var i = 0; i < tagsInputs.length; i++) {
                $scope.idea.tags.push(tagsInputs[i].defaultValue);
            }
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
    }])

    .controller('ApplyCtrl', ['$scope', '$location', '$routeParams', 'Application', function ($scope, $location, $routeParams, Application) {
        $scope.submitted = false;
        $scope.application = {
            ideaId: $routeParams.ideaId
        };
        $scope.errors = "";

        $scope.apply = function (form) {
            $scope.submitted = true;
            Application.create($scope.application, function () {
                $scope.$apply(function () {

                })
            }, function (err) {
                $scope.$apply(function () {
                    $scope.errors = err;
                })
            })
        }
    }]);
