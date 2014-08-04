'use strict';

/* Services */

angular.module('iBoard.services', [])
    .service('ToolsProvider', function () {
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
         * Get all ideas in the database
         * TODO: Select ideas based on likes and comments
         * @param succCallback Do something with the ideas
         * @param errCallback Report the error to the calling agent
         */
        var getAllIdeas = function (succCallback, errCallback) {
            var Idea = AV.Object.extend("Idea");
            var query = new AV.Query(Idea);
            query.descending('createdAt');

            query.find({
                success: function (ideas) {
                    succCallback(ideas);
                }, error: function (_ideas, err) {
                    console.log("Error during loading ideas");
                    errCallback(err);
                }
            })
        };

        /**
         * Get all liked users related to a specific idea
         * @param idea the idea for querying users
         * @param succCallback Do something with the ideas
         * @param errCallback Report the error to the calling agent
         */
        var getAllLikedUsers = function (idea, succCallback, errCallback) {
            var query = AV.Relation.reverseQuery('_User', 'likes', idea);
            query.find({
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
            getUserIdeas: getUserIdeas,
            getAllIdeas: getAllIdeas,
            getAllLikedUsers: getAllLikedUsers
        }

    }])

    .factory('Suggest', [ 'ToolsProvider', function (ToolsProvider) {
        var createSuggest = function (data, succCallback, errCallback) {
            var Suggestion = AV.Object.extend("Suggestion");
            var relatedIdea = AV.Object.createWithoutData('Idea', data.ideaId);
            var suggest = new Suggestion();

            ToolsProvider.checkUserStatus(function (user) {
                suggest.save({
                    idea: relatedIdea,
                    advisor: user,
                    category: data.category.value,
                    source: typeof(data.source) == "undefined" ? "" : data.source,
                    approved: false
                }, function (_suggest) {
                    succCallback(_suggest);
                }, function (obj, err) {
                    console.log("Error occurred when creating a suggestion");
                    errCallback(err);
                })
            }, function (err) {
                errCallback(err);
            })
        };

        return {
            create: createSuggest
        }
    }])
