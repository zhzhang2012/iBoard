'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('iBoard.services', [])
    .factory('User', function () {

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
                success: function () {
                    succCallback(user);
                },
                error: function (error) {
                    // Show the error message somewhere
                    console.log("Error: " + error.code + " " + error.message);
                    errCallback(error);
                }
            });
        };

        return {
            register: register,
            login: login,
            logout: logout,
            resetPass: resetPass
        }

    })

    .factory('Idea', function () {

        function checkUserStatus(then, err) {
            var currentUser = AV.User.current();
            if (currentUser) {
                then(currentUser);
            } else {
                err("Invalid request!");
            }
        }

        /**
         * Create a new idea
         * @param ideaData The content of the idea
         * @param succCallback Do something with the new idea
         * @param errCallback Report the error during saving to the calling agent
         */
        var createIdea = function (ideaData, succCallback, errCallback) {
            var Idea = AV.Object.extend("Idea");
            var idea = new Idea();

            checkUserStatus(function (user) {
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

            checkUserStatus(function (user) {
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
        var getAllIdeas = function (succCallback, errCallback) {
            var Idea = AV.Object.extend("Idea");
            var query = new AV.Query(Idea);

            checkUserStatus(function (user) {
                query.equalTo("publisher", user);
                query.find({
                    success: function (_ideas) {
                        succCallback(_ideas);
                    }, error: function (_ideas, err) {
                        console.log("Invalid User: " + err.description)
                        errCallback(err);
                    }
                })
            }, function (err) {
                errCallback(err);
            })
        };

        return {
            createIdea: createIdea,
            deleteIdea: deleteIdea,
            getAllIdeas: getAllIdeas
        }

    })
