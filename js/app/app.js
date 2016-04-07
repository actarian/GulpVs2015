/*global angular */

var app = angular.module('app', ['ngRoute']);

app.config(['$httpProvider', '$routeProvider', '$locationProvider', function ($httpProvider, $routeProvider, $locationProvider) {

    $routeProvider.when('/', {
        state: 'home',
        title: 'Home',
        templateUrl: 'partial/home',
        controller: 'HomeCtrl',

    }).when('/about', {
        state: 'about',
        title: 'About',
        templateUrl: 'partial/about',
        controller: 'AboutCtrl',

    }).when('/contact', {
        state: 'contact',
        title: 'Contact',
        templateUrl: 'partial/contact',
        controller: 'ContactCtrl',
    });

    $routeProvider.otherwise('/');
    
    // HTML5 MODE url writing method (false: #/anchor/use, true: /html5/url/use)
    $locationProvider.html5Mode(true);

}]);

app.run(['$rootScope', function ($rootScope) {
    var currentState = null;
    $rootScope.$on("$routeChangeSuccess", function ($scope, nextRoute, lastRoute) {
        currentState = nextRoute.$$route.state;
        console.log("$routeChangeSuccess", currentState);
        setTimeout(function () {
            if (document.body.scrollTop !== undefined) {
                document.body.scrollTop = 0;
            } else {
                document.documentElement.scrollTop = 0;
            }
        }, 100);
    });
    $rootScope.isState = function(state) {
        return state == currentState;
    };
}]);
