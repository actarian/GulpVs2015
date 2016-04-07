
app.filter('customNumber', ['$filter', function ($filter) {
    var filter = $filter('number');
    return function (value, precision, unit) {
        unit = unit || '';
        return (value ? filter(value, precision) + unit : '-');
        // return value === 0 ? '0' + unit : (value ? filter(value, precision) + unit : '-');
    }
}]);

app.filter('customDistance', ['$filter', function ($filter) {
    var filter = $filter('number');
    return function (km) {
        if (km || km === 0) {
            var unit, precision;
            if (km > 1) {
                precision = 2;
                unit = ' Km';
            } else {
                precision = 0;
                km *= 1000;
                unit = ' m';
            }
            return filter(km, precision) + unit;
        } else {
            return '-';
        }
        // return value === 0 ? '0' + unit : (value ? filter(value, precision) + unit : '-');
    }
}]);

app.filter('customDate', ['$filter', function ($filter) {
    var filter = $filter('date');
    return function (value, format, timezone) {
        return value ? filter(value, format, timezone) : '-';
    }
}]);

app.filter('customTime', ['$filter', function ($filter) {
    return function (value, placeholder) {
        if (value) {
            return Utils.parseTime(value);
        } else {
            return (placeholder ? placeholder : '-');
        }
    }
}]);

app.filter('customDigital', ['$filter', function ($filter) {
    return function (value, placeholder) {
        if (value) {
            return Utils.parseHour(value);
        } else {
            return (placeholder ? placeholder : '-');
        }
    }
}]);

app.filter('customString', ['$filter', function ($filter) {
    return function (value, placeholder) {
        return value ? value : (placeholder ? placeholder : '-');
    }
}]);

app.filter('orderByGear', function () {
    return function (input, attribute) {
        if (!angular.isObject(input)) return input;
        var array = [];
        for (var objectKey in input) {
            array.push(input[objectKey]);
        }
        var name = attribute, dir = 1;
        if (attribute.indexOf('-') === 0) {
            dir = -1;
            name = attribute.substr(1, attribute.length - 1);
        }
        switch (name) {
            case 'name':
                if (dir > 0) {
                    array.sort(function (a, b) {
                        if (a.frontSprocket == b.frontSprocket) {
                            return b.backSprocket - a.backSprocket;
                        } else {
                            return a.frontSprocket - b.frontSprocket;
                        }
                    });
                } else {
                    array.sort(function (a, b) {
                        if (a.frontSprocket == b.frontSprocket) {
                            return a.backSprocket - b.backSprocket;
                        } else {
                            return b.frontSprocket - a.frontSprocket;
                        }
                    });
                }
                break;
            default:
                if (dir > 0) {
                    array.sort(function (a, b) {
                        return b[name] - a[name];
                    });
                } else {
                    array.sort(function (a, b) {
                        return a[name] - b[name];
                    });
                }
        }
        return array;
    }
});
