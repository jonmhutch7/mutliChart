'use strict';

angular.module('chartsApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.data = [];

    $http.get('assets/mock/mock.json').success(function(data) {
      $scope.data = data;
    });

  });
