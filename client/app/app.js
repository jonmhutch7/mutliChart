'use strict';

angular.module('chartsApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute'
])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .otherwise({
        redirectTo: '/charts'
      });

    $locationProvider.html5Mode(true);
  });
