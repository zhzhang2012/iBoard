'use strict';

/* Services */

angular.module('iBoard.services', [])
    .service('ToolsProvider', function () {
        /**
         * User logged in authorization decorator
         */
        this.checkUserStatus = function (then, err) {
            var currentUser = AV.User.current();
            if (currentUser) {
                then(currentUser);
            } else {
                err("Invalid request!");
            }
        };
    })

    .factory('User', [ 'ToolsProvider', function (ToolsProvider) {
        var register = function (data, succCallback, errCallback) {
            var user = new AV.User();
            user.set("username", data.username);
            user.set("email", data.email);
            user.set("password", data.password);

            user.signUp(null, {
                success: function (user) {
                    succCallback(user);
                },
                error: function (user, error) {
                    // Show the error message somewhere and let the user try again.
                    console.log("Error: " + error.code + " " + error.message);
                    errCallback(error)
                }
            });
        };

        var login = function (user, succCallback, errCallback) {
            AV.User.logIn(user.username, user.password, {
                success: function (user) {
                    succCallback(user);
                },
                error: function (user, error) {
                    errCallback(error);
                }
            });
        };

        var logout = function (succCallback, errCallback) {
            if (AV.User.current()) {
                AV.User.logOut();
                succCallback();
            } else {
                console.log("Invalid request!");
                errCallback();
            }
        };

        var resetPass = function (email, succCallback, errCallback) {
            AV.User.requestPasswordReset(email, {
                success: function (user) {
                    succCallback(user);
                },
                error: function (error) {
                    // Show the error message somewhere
                    console.log("Error: " + error.code + " " + error.message);
                    errCallback(error);
                }
            })
        };

        var findUserById = function (userid, succCallback, errCallback) {
            var query = new AV.Query(AV.User);
            query.get(userid, {
                success: function (user) {
                    succCallback(user);
                }, error: function (object, err) {
                    console.log("Error finding user: " + err.message);
                    errCallback(err);
                }
            }, function () {

            })
        };

        /**
         * Like an idea
         * @param ideaId the idea that will be recorded
         * @param errCallback Report the error to the calling agent
         */
        var likeIdea = function (ideaId, errCallback) {
            ToolsProvider.checkUserStatus(function (user) {
                var relation = user.relation('likes');
                relation.add(ideaId);
                user.save(null, {
                    success: function (user) {
                        console.log("Successfully liked a post!");
                    }, error: function (user, err) {
                        console.log("Error occurred suring like actio: " + err.massage);
                        errCallback(err);
                    }
                })
            }, function (err) {
                errCallback(err);
            })
        };

        var getAllLikedIdeas = function (succCallback, errCallback) {
            ToolsProvider.checkUserStatus(function (user) {
                var relation = user.relation('likes');
                relation.query().find({
                    success: function (likes) {
                        succCallback(likes);
                    }, error: function (likes, err) {
                        console.log("Error loading likes");
                        errCallback(err);
                    }
                })
            }, function (err) {
                errCallback(err);
            })
        };

        return {
            register: register,
            login: login,
            logout: logout,
            findUserById: findUserById,
            resetPass: resetPass,
            like: likeIdea,
            getAllLikedIdeas: getAllLikedIdeas
        }

    }])

    .factory('Idea', [ 'ToolsProvider', function (ToolsProvider) {

        var ideaResources = [];

        /**
         * Create a new idea
         * @param ideaData The content of the idea
         * @param succCallback Do something with the new idea
         * @param errCallback Report the error during saving to the calling agent
         */
        var createIdea = function (ideaData, succCallback, errCallback) {
            var Idea = AV.Object.extend("Idea");
            var idea = new Idea();

            ToolsProvider.checkUserStatus(function (user) {
                idea.save({
                    publisher: user,
                    content: ideaData.content
                }, {
                    success: function (_idea) {
                        succCallback(_idea);
                    },
                    error: function (_idea, err) {
                        console.log('Failed to create new idea, with error code: ' + err.description);
                        errCallback(err);
                    }
                })
            }, function (err) {
                errCallback(err);
            })
        };

        /**
         * Delete a specific idea
         * @param objectId The key for querying idea
         * @param succCallback Give the option to do some final staff with the deleted idea
         * @param errCallback Report the error to the calling agent
         */
        var deleteIdea = function (objectId, succCallback, errCallback) {
            var Idea = AV.Object.extend("Idea");
            var query = new AV.Query(Idea);

            ToolsProvider.checkUserStatus(function (user) {
                var queryPromise = query.get(objectId)
                queryPromise.then(function (_idea) {
                    var deletePromise = _idea.destroy();
                    deletePromise.then(function () {
                        succCallback(_idea);
                    }, function (_idea, err) {
                        console.log('Failed to delete idea, with error code: ' + err.description);
                        errCallback(err);
                    })

                }, function (err) {
                    errCallback(err);
                })
            })
        };

        /**
         * Find a specific idea given the idea id
         * @param ideaId the query info
         * @param succCallback Do something with the idea
         * @param errCallback Report the error to the calling agent
         */
        var getIdeaById = function (ideaId, succCallback, errCallback) {
            var Idea = AV.Object.extend("Idea");
            var query = new AV.Query(Idea);
            query.include("publisher");

            query.get(ideaId, {
                success: function (_idea) {
                    succCallback(_idea);
                }, error: function (obj, err) {
                    console.log("Error when fetching ideas");
                    errCallback(err);
                }
            })
        };

        /**
         * Get a collection of ideas given the user
         * @param succCallback Do something with the ideas
         * @param errCallback Report the error to the calling agent
         */
        var getUserIdeas = function (succCallback, errCallback) {
            var Idea = AV.Object.extend("Idea");
            var query = new AV.Query(Idea);
            query.descending('createdAt');

            ToolsProvider.checkUserStatus(function (user) {
                query.equalTo("publisher", user);
                query.find({
                    success: function (_ideas) {
                        succCallback(_ideas);
                    }, error: function (_ideas, err) {
                        console.log("Invalid User: " + err.message)
                        errCallback(err);
                    }
                })
            }, function (err) {
                errCallback(err);
            })
        };

        /**
         * Get featured ideas in the database
         * TODO Select ideas based on likes and comments
         * @param succCallback Do something with the ideas
         * @param errCallback Report the error to the calling agent
         */
        var loadAllIdeas = function (succCallback, errCallback) {
            var Idea = AV.Object.extend("Idea");
            var query = new AV.Query(Idea);
            query.include("publisher");

            query.find().then(function (_ideas) {
                ideaResources = _ideas;
                var queryPromises = [];
                angular.forEach(ideaResources, function (idea, index) {
                    var reverseQuery = AV.Relation.reverseQuery('_User', 'likes', idea);
                    var reverseQueryPromise = new AV.Promise();
                    queryPromises.push(reverseQueryPromise);
                    reverseQuery.count().then(function (num) {
                        ideaResources[index].like = {
                            num: num
                        };
                        reverseQueryPromise.resolve();
                    }, function (err) {
                        reverseQueryPromise.reject(err);
                    });
                });
                return AV.Promise.when(queryPromises);
            }).then(function () {
                    succCallback(ideaResources);
                }, function () {
                    console.log("Error during loading ideas");
                    errCallback(err);
                })
        };

        //Memoization decorator
        var checkIdeaResourcesStatus = function (succCallback, errCallback) {
            if (ideaResources.length == 0) {
                loadAllIdeas(function (_ideas) {
                    succCallback(_ideas);
                }, function (err) {
                    errCallback(err);
                })
            } else {
                succCallback(ideaResources);
            }
        };

        //Sort Decorator
        var sortIdeas = function (ideas, limit, comparator, callback) {
            var sortedIdeas = _.sortBy(ideas, comparator);
            callback(sortedIdeas.reverse().slice(0, limit));
        };

        var getFeaturedIdeas = function (type, limit, succCallback, errCallback) {
            switch (type) {
                case 0:
                    checkIdeaResourcesStatus(function (_ideas) {
                        var comparator = function (_idea) {
                            return _idea.like.num;
                        };
                        sortIdeas(_ideas, limit, comparator, succCallback);
                    }, function (err) {
                        errCallback(err);
                    });
                    break;
                case 1:
                    checkIdeaResourcesStatus(function (_ideas) {
                        var comparator = function (_idea) {
                            return (new Date(_idea.createdAt)).getTime();
                        };
                        sortIdeas(_ideas, limit, comparator, succCallback);
                    }, function (err) {
                        errCallback(err);
                    });
                    break;
                default :
                    errCallback("Error sorting type!");
            }
        };

        /**
         * Get all liked users related to a specific idea
         * @param idea the idea for querying users
         * @param succCallback Do something with the ideas
         * @param errCallback Report the error to the calling agent
         */
        var getAllLikedUsers = function (idea, succCallback, errCallback) {
            var reverseQuery = AV.Relation.reverseQuery('_User', 'likes', idea);
            reverseQuery.find({
                success: function (users) {
                    succCallback(users);
                }, error: function (users, err) {
                    console.log("Error occurred during loading liked users");
                    errCallback(err);
                }
            })
        };

        return {
            createIdea: createIdea,
            deleteIdea: deleteIdea,
            getIdeaById: getIdeaById,
            getUserIdeas: getUserIdeas,
            getFeaturedIdeas: getFeaturedIdeas,
            getAllLikedUsers: getAllLikedUsers
        }

    }])

    .
    factory('Suggest', [ 'ToolsProvider', function (ToolsProvider) {
        var createSuggest = function (data, succCallback, errCallback) {
            var Suggestion = AV.Object.extend("Suggestion");
            var relatedIdea = AV.Object.createWithoutData('Idea', data.ideaId);
            var suggest = new Suggestion();

            ToolsProvider.checkUserStatus(function (user) {
                suggest.save({
                    idea: relatedIdea,
                    advisor: user,
                    category: data.category,
                    source: typeof(data.source) == "undefined" ? "" : data.source,
                    approved: false
                }, {success: function (_suggest) {
                    succCallback(_suggest);
                }, error: function (obj, err) {
                    console.log("Error occurred when creating a suggestion");
                    errCallback(err);
                }})
            }, function (err) {
                errCallback(err);
            })
        };

        var getIdeaSuggests = function (ideaId, succCallback, errCallback) {
            var Suggestion = AV.Object.extend("Suggestion");
            var Idea = AV.Object.extend("Idea");
            var idea = new Idea();
            idea.id = ideaId;

            var query = new AV.Query(Suggestion);
            query.equalTo("idea", idea);
            query.descending("createdAt");
            query.include("advisor");

            query.find({
                success: function (_suggests) {
                    succCallback(_suggests);
                }, error: function (obj, err) {
                    console.log("Error fetching suggests!");
                    errCallback(err);
                }
            })
        };

        return {
            create: createSuggest,
            getIdeaSuggests: getIdeaSuggests
        }
    }])

    .factory('Comment', [ 'ToolsProvider', function (ToolsProvider) {
        var createComment = function (data, succCallback, errCallback) {
            var Comment = AV.Object.extend("Comment");
            var relatedIdea = AV.Object.createWithoutData('Idea', data.ideaId);
            var relatedUser = AV.Object.createWithoutData('_User', data.replyTo);
            var comment = new Comment();

            ToolsProvider.checkUserStatus(function (user) {
                comment.save({
                    idea: relatedIdea,
                    commenter: user,
                    replyTo: relatedUser,
                    content: data.content,
                    like: 0,
                    dislike: 0
                }, {success: function (_comment) {
                    succCallback(_comment);
                }, error: function (obj, err) {
                    console.log("Error occurred when commenting an idea");
                    errCallback(err);
                }})
            }, function (err) {
                errCallback(err);
            })
        };

        var getIdeaComments = function (ideaId, succCallback, errCallback) {
            var Comment = AV.Object.extend("Comment");
            var Idea = AV.Object.extend("Idea");
            var idea = new Idea();
            idea.id = ideaId;

            var query = new AV.Query(Comment);
            query.equalTo("idea", idea);
            query.descending("createdAt");
            query.include("commenter");
            query.include("replyTo");

            query.find({
                success: function (_comments) {
                    succCallback(_comments);
                }, error: function (_comments, err) {
                    console.log("Error fetching comments!");
                    errCallback(err);
                }
            })
        };

        var likedislikeComment = function (commentId, column, succCallback, errCallback) {
            var Comment = AV.Object.extend("Comment");
            var query = new AV.Query(Comment);

            query.get(commentId,function (comment) {
                comment.increment(column);
                return comment.save();
            },function (obj, err) {
                return AV.Promise.error(err);
            }).then(function (comment) {
                    succCallback(comment);
                }, function (err) {
                    console.log("Error occurred when like/dislike comments");
                    errCallback(err);
                })
        };

        return {
            create: createComment,
            getIdeaComments: getIdeaComments,
            likedislikeComment: likedislikeComment
        }
    }]);
