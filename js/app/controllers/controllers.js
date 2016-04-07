/*global angular */

app.controller('RootCtrl', ['$scope', '$route', '$location', 'Config', function ($scope, $route, $location, Config) {
    console.log('RootCtrl');
    $scope.config = Config;
}]);

app.controller('HomeCtrl', ['$scope', '$route', '$location', function ($scope, $route, $location) {
    console.log('HomeCtrl');
}]);

app.controller('AboutCtrl', ['$scope', '$route', '$location', function ($scope, $route, $location) {
    console.log('AboutCtrl');
}]);

app.controller('ContactCtrl', ['$scope', '$route', '$location', function ($scope, $route, $location) {
    console.log('ContactCtrl');
}]);
