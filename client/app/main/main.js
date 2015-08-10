'use strict';

angular.module('chartsApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/charts', {
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      });
  });