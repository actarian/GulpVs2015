/*global angular */

app.factory('Config', ['$http', function ($http) {
    $http.get('config.json').then(function (response) {
        angular.extend(this, response.data);
    }.bind(this));
    return this;
}]);

app.factory('Model', [function () {
    function Model(data) {
        // Extend instance with data
        data ? angular.extend(this, data) : null;
    }
    Model.prototype = {
        toString: function () {
            return "Model";
        },
    };
    return Model;
}]);
