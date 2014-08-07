'use strict';

/* Directives */


angular.module('iBoard.directives', [])
    .directive('ngUnique', function () {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                elem.on('blur', function (evt) {
                    scope.$apply(function () {
                        if (!elem.val() || !(elem.val().trim())) {
                            return;
                        }

                        var emailQuery = new AV.Query(AV.User);
                        emailQuery.equalTo("email", elem.val());
                        var usernameQuery = new AV.Query(AV.User);
                        usernameQuery.equalTo("username", elem.val());
                        var query = AV.Query.or(emailQuery, usernameQuery);

                        query.count({
                            success: function (num) {
                                scope.$apply(function () {
                                    console.log('data.unique: ' + !num);
                                    ctrl.$setValidity('unique', !num);
                                })
                            }, error: function (err) {
                                scope.$apply(function () {
                                    console.log('ngUnique error: ' + angular.toJson(err));
                                    ctrl.$setValidity('unique', false);
                                })
                            }
                        })
                    });
                });
            }
        }
    })

    .directive('ngEmail', function () {
        return {
            require: 'ngModel',
            link: function (scope, ele, attrs, c) {
                var p = new Object();
                p.email = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
                ele.on('blur', function (evt) {
                    scope.$apply(function () {
                        var value = ele.val();
                        if (p.email.test(value)) {
                            c.$setValidity('ep', true);
                        } else {
                            c.$setValidity('ep', false);
                        }
                    })
                })
            }
        }
    })

    .directive('ngConfirm', function () {
        return {
            require: 'ngModel',
            link: function (scope, ele, attrs, c) {
                ele.on('blur', function (evt) {
                    scope.$apply(function () {
                        c.$setValidity('confirm', (scope.user.password === scope.user.conpwd));
                    })
                })
            }
        }
    })

