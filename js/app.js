
var Vector = function () {
    function Vector(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    Vector.make = function (a, b) {
        return new Vector(b.x - a.x, b.y - a.y);
    };
    Vector.size = function (a) {
        return Math.sqrt(a.x * a.x + a.y * a.y);
    };
    Vector.normalize = function (a) {
        var l = Vector.size(a);
        a.x /= l;
        a.y /= l;
        return a;
    };
    Vector.incidence = function (a, b) {
        var angle = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
        // if (angle < 0) angle += 2 * Math.PI;
        // angle = Math.min(angle, (Math.PI * 2 - angle));
        return angle;
    };
    Vector.distance = function (a, b) {
        return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
    };
    Vector.cross = function (a, b) {
        return (a.x * b.y) - (a.y * b.x);
    };
    Vector.difference = function (a, b) {
        return new Vector(b.x - a.x, b.y - a.y);
    };
    Vector.prototype = {
        size: function () {
            return Vector.size(this);
        },
        normalize: function () {
            return Vector.normalize(this);
        },
        incidence: function (b) {
            return Vector.incidence(this, b);
        },
        cross: function (b) {
            return Vector.cross(this, b);
        },
        towards: function (b, friction) {
            friction = friction || 0.125;
            this.x += (b.x - this.x) * friction;
            this.y += (b.y - this.y) * friction;
            return this;
        },
        add: function (b) {
            this.x += b.x;
            this.y += b.y;
            return this;
        },
        friction: function (b) {
            this.x *= b;
            this.y *= b;
            return this;
        },
        copy: function (b) {
            return new Vector(this.x, this.y);
        },
        toString: function () {
            return '{' + this.x + ',' + this.y + '}';
        },
    };
    return Vector;
}();

var Utils = function () {

    (function () {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                                       || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function (callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }
    }());

    var transformProperty = function detectTransformProperty() {
        var transformProperty = 'transform',
            safariPropertyHack = 'webkitTransform';
        var div = document.createElement("DIV");
        if (typeof div.style[transformProperty] !== 'undefined') {
            ['webkit', 'moz', 'o', 'ms'].every(function (prefix) {
                var e = '-' + prefix + '-transform';
                if (typeof div.style[e] !== 'undefined') {
                    transformProperty = e;
                    return false;
                }
                return true;
            });
        } else if (typeof div.style[safariPropertyHack] !== 'undefined') {
            transformProperty = '-webkit-transform';
        } else {
            transformProperty = undefined;
        }
        return transformProperty;
    }();

    function getTouch(e, previous) {
        var t = new Vector();
        if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel') {
            var touch = null;
            var event = e.originalEvent ? e.originalEvent : e;
            // event.stopImmediatePropagation();            
            // event.currentTarget.removeEventListener('mousedown mousemove mouseup');
            var touches = event.touches.length ? event.touches : event.changedTouches;
            if (touches && touches.length) {
                touch = touches[0];
            }
            if (touch) {
                t.x = touch.pageX;
                t.y = touch.pageY;
            }
        } else if (e.type == 'click' || e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover' || e.type == 'mouseout' || e.type == 'mouseenter' || e.type == 'mouseleave') {
            t.x = e.pageX;
            t.y = e.pageY;
        }
        if (previous) {
            t.s = Vector.difference(previous, t);
        }
        t.type = e.type;
        return t;
    }

    function getRelativeTouch(element, point) {
        var st = window.scrollY || window.pageYOffset || document.body.scrollTop + (document.documentElement && document.documentElement.scrollTop || 0);
        var rect = element[0].getBoundingClientRect();
        var e = new Vector(rect.left, rect.top + st);
        return Vector.difference(e, point);
    }

    function getClosest(el, selector) {
        var matchesFn, parent;
        ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function (fn) {
            if (typeof document.body[fn] == 'function') {
                matchesFn = fn;
                return true;
            }
            return false;
        });
        while (el !== null) {
            parent = el.parentElement;
            if (parent !== null && parent[matchesFn](selector)) {
                return parent;
            }
            el = parent;
        }
        return null;
    }

    function indexOf(array, object, key) {
        key = key || 'id';
        var index = -1;
        if (array) {
            var i = 0, t = array.length;
            while (i < t) {
                if (array[i] && array[i][key] === object[key]) {
                    index = i;
                    break;
                }
                i++;
            }
        }
        return index;
    }

    function removeValue(array, value) {
        var index = -1;
        if (array) {
            var i = 0, t = array.length;
            while (i < t) {
                if (array[i] === value) {
                    index = i;
                    break;
                }
                i++;
            }
        }
        if (index !== -1) {
            array.splice(index, 1);
            return value;
        } else {
            return null;
        }
    }

    function parseHour(duration, offset) {
        offset = offset || 0;
        duration = duration - offset * 60 * 1000;
        var milliseconds = parseInt((duration % 1000) / 100)
            , seconds = parseInt((duration / 1000) % 60)
            , minutes = parseInt((duration / (1000 * 60)) % 60)
            , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

        var hours = (hours < 10) ? "0" + hours : hours;
        var minutes = (minutes < 10) ? "0" + minutes : minutes;
        var seconds = (seconds < 10) ? "0" + seconds : seconds;
        return hours + ':' + minutes + ':' + seconds; // + "." + milliseconds;
    }

    function parseTime(duration, offset) {
        offset = offset || 0;
        duration = duration - offset * 60 * 1000;
        var milliseconds = parseInt((duration % 1000) / 100)
            , seconds = parseInt((duration / 1000) % 60)
            , minutes = parseInt((duration / (1000 * 60)) % 60)
            , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

        return (hours ? hours + 'h ' : '') + (minutes ? minutes + '\' ' : '') + (seconds ? seconds + '\'\' ' : ''); // + "." + milliseconds;
    }

    var getNow = Date.now || function () {
        return new Date().getTime();
    };

    function throttle(func, wait, options) {
        // Returns a function, that, when invoked, will only be triggered at most once
        // during a given window of time. Normally, the throttled function will run
        // as much as it can, without ever going more than once per `wait` duration;
        // but if you'd like to disable the execution on the leading edge, pass
        // `{leading: false}`. To disable execution on the trailing edge, ditto.
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options) options = {};
        var later = function () {
            previous = options.leading === false ? 0 : getNow();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function () {
            var now = getNow();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    }

    var Style = function () {
        function Style() {
            this.props = {
                scale: 1,
                hoverScale: 1,
                currentScale: 1,
            }
        }
        Style.prototype = {
            set: function (element) {
                var styles = [];
                for (var key in this) {
                    if (key !== 'props') {
                        styles.push(key + ':' + this[key]);
                    }
                }
                element.style.cssText = styles.join(';') + ';';
            },
            transform: function (transform) {
                this[Utils.transformProperty] = transform;
            },
            transformOrigin: function (x, y) {
                this[Utils.transformProperty + '-origin-x'] = (Math.round(x * 1000) / 1000) + '%';
                this[Utils.transformProperty + '-origin-y'] = (Math.round(y * 1000) / 1000) + '%';
            },
        };
        return Style;
    }();

    var Cookie = function () {
        function Cookie() {
        }

        Cookie._set = function (name, value, days) {
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                var expires = "; expires=" + date.toGMTString();
            } else {
                var expires = "";
            }
            window.document.cookie = name + "=" + value + expires + "; path=/";
        }

        Cookie.set = function (name, value, days) {
            try {
                var cache = [];
                var json = JSON.stringify(value, function (key, value) {
                    if (key === 'pool') {
                        return;
                    }
                    if (typeof value === 'object' && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            // Circular reference found, discard key
                            return;
                        }
                        cache.push(value);
                    }
                    return value;
                });
                cache = null;
                Cookie._set(name, json, days);
            } catch (e) {
                console.log('Cookie.set.error serializing', name, value, e);
            }
        };

        Cookie.get = function (name) {
            var cookieName = name + "=";
            var ca = window.document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(cookieName) == 0) {
                    var value = c.substring(cookieName.length, c.length);
                    var data = null;
                    try {
                        data = JSON.parse(value);
                    } catch (e) {
                        console.log('Cookie.get.error parsing', key, e);
                    };
                    return data;
                }
            }
            return null;
        };

        Cookie.delete = function (name) {
            Cookie._set(name, "", -1);
        };

        Cookie.on = function (name) {
            var deferred = $q.defer();
            var i, interval = 1000, elapsed = 0, timeout = 60 * 1000;
            function checkCookie() {
                if (elapsed > timeout) {
                    deferred.reject('timeout');
                } else {
                    var c = Cookie.get(name);
                    if (c) {
                        deferred.resolve(c);
                    } else {
                        elapsed += interval;
                        i = setTimeout(checkCookie, interval);
                    }
                }
            }
            checkCookie();
            return deferred.promise;
        };

        return Cookie;
    }();

    var LocalStorage = function () {
        function LocalStorage() {
        }

        function isLocalStorageSupported() {
            var supported = false;
            try {
                supported = 'localStorage' in window && window['localStorage'] !== null;
                if (supported) {
                    window.localStorage.setItem('test', '1');
                    window.localStorage.removeItem('test');
                } else {
                    supported = false;
                }
            } catch (e) {
                supported = false;
            }
            return supported;
        }
        LocalStorage.isSupported = isLocalStorageSupported();

        if (LocalStorage.isSupported) {
            LocalStorage.set = function (name, value) {
                try {
                    var cache = [];
                    var json = JSON.stringify(value, function (key, value) {
                        if (key === 'pool') {
                            return;
                        }
                        if (typeof value === 'object' && value !== null) {
                            if (cache.indexOf(value) !== -1) {
                                // Circular reference found, discard key
                                return;
                            }
                            cache.push(value);
                        }
                        return value;
                    });
                    cache = null;
                    window.localStorage.setItem(name, json);
                } catch (e) {
                    console.log('LocalStorage.set.error serializing', name, value, e);
                }
            };

            LocalStorage.get = function (name) {
                var value = null;
                if (window.localStorage[name] !== undefined) {
                    try {
                        value = JSON.parse(window.localStorage[name]);
                    } catch (e) {
                        console.log('LocalStorage.get.error parsing', name, e);
                    }
                }
                return value;
            };

            LocalStorage.delete = function (name) {
                window.localStorage.removeItem(name);
            };

            LocalStorage.on = function (name) {
                var deferred = $q.defer();
                var i, timeout = 60 * 1000;
                function storageEvent(e) {
                    // console.log('LocalStorage.on', name, e);
                    clearTimeout(i);
                    if (e.originalEvent.key == name) {
                        try {
                            var value = JSON.parse(e.originalEvent.newValue); // , e.originalEvent.oldValue
                            deferred.resolve(value);
                        } catch (e) {
                            console.log('LocalStorage.on.error parsing', name, e);
                            deferred.reject('error parsing ' + name);
                        }
                    }
                }
                if (window.addEventListener) {
                    window.addEventListener('storage', storageEvent, false);
                } else {
                    window.attachEvent('onstorage', storageEvent);
                }
                i = setTimeout(function () {
                    deferred.reject('timeout');
                }, timeout);
                return deferred.promise;
            };

        } else {
            console.log('LocalStorage.unsupported switching to cookies');
            LocalStorage.set = Cookie.set;
            LocalStorage.get = Cookie.get;
            LocalStorage.delete = Cookie.delete;
            LocalStorage.on = Cookie.on;

        }

        return LocalStorage;
    }();

    function Utils() {

    }

    Utils.transformProperty = transformProperty;
    Utils.getTouch = getTouch;
    Utils.getRelativeTouch = getRelativeTouch;
    Utils.getClosest = getClosest;
    Utils.indexOf = indexOf;
    Utils.removeValue = removeValue;
    Utils.parseHour = parseHour;
    Utils.parseTime = parseTime;
    Utils.throttle = throttle;
    Utils.Style = Style;
    Utils.LocalStorage = LocalStorage;
    Utils.Cookie = Cookie;

    return Utils;

}();
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

    $rootScope.$on("$routeChangeSuccess", function ($scope, nextRoute, lastRoute) {
        console.log("$routeChangeSuccess", nextRoute.$$route.state);
        setTimeout(function () {
            if (document.body.scrollTop !== undefined) {
                document.body.scrollTop = 0;
            } else {
                document.documentElement.scrollTop = 0;
            }
        }, 100);
    });

}]);


app.animation('.navigation-animation', function($rootScope, $animate) {       
    var previousRoute = null;
    var currentRoute = null;    
    var bezierOptions = {
        type: dynamics.bezier,
        points: [{x:0,y:0,cp:[{x:0.509,y:0.007}]},{x:1,y:1,cp:[{x:0.566,y:0.997}]}],
        duration : 500,
    }    
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
        previousRoute = previous.$$route;
        currentRoute = current.$$route;
    });   
    function isFirstView() {
        return !currentRoute;
    }    
    function isBackward() {
        return previousRoute.isForward;
    }    
    return {
        enter: function(element, done) {                        
            if (isFirstView()) {
                // FIRST ENTERING ANIMATION
                dynamics.css(element[0], {
                    translateY: 0,
                    opacity: 0,
                    scale: 1.2,
                });
                dynamics.animate(element[0], {
                    translateY: 0,
                    opacity: 1,
                    scale: 1,
                }, bezierOptions);            
            } else if (isBackward()) {
                // BACKWARD ENTERING ANIMATION
                var w = element[0].offsetWidth;
                dynamics.css(element[0], {
                    translateX: -w
                });
                dynamics.animate(element[0], {
                    translateX: 0
                }, bezierOptions); 
            } else {
                // FORWARD ENTERING ANIMATION
                var w = element[0].offsetWidth;
                dynamics.css(element[0], {
                    translateX: w
                });
                dynamics.animate(element[0], {
                    translateX: 0
                }, bezierOptions); 
            }
            done();
        },    
        leave: function(element, done) {
            if (isBackward()) {
                // BACKWARD EXITING ANIMATION
                var w = element[0].offsetWidth;
                dynamics.css(element[0], {
                    translateX: 0
                });
                dynamics.animate(element[0], {
                    translateX: w
                }, bezierOptions); 
            } else {
                // FORWARD EXITING ANIMATION
                var w = element[0].offsetWidth;
                dynamics.css(element[0], {
                    translateX: 0
                });
                dynamics.animate(element[0], {
                    translateX: -w
                }, bezierOptions); 
            }
            setTimeout(done, 1000);
        }
    }
});

/*global angular,dynamics */

app.directive('validateType', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attributes, model) {
            var type = attributes.validateType;
            // console.log('validateType', type, model.$parsers, model);
            switch (type) {
                case 'number':
                    model.$parsers.unshift(function (value) {
                        // console.log('validateType', type, value, Number(value).toString() == String(value), angular.isNumber(Number(value)));
                        model.$setValidity(type, Number(value).toString() == String(value));
                        return value;
                    });
                    break;
                case 'array':
                    // model.$validators.required ? delete model.$validators.required : null;
                    model.$validators.required = function () {
                        // console.log('required', model.$modelValue);
                        var array = model.$modelValue;
                        if (!array) {
                            return false;
                        }
                        var label = (attributes.label !== undefined) ? attributes.label : 'name';
                        var value = '';
                        angular.forEach(array, function (obj, i) {
                            value += (i > 0 ? ', ' : '') + obj[label];
                        })
                        element[0].value = value;
                        return array.length > 0;
                    };
                    scope.$watch(function () {
                        return model.$modelValue && model.$modelValue.length;
                    }, function () {
                        model.$validate(); // validate again when array changes
                    });
                    /*
                    model.$parsers.unshift(function (value) {
                        console.log('validateType', type, value);
                        model.$setValidity(type, value.length > 0);
                        return value;
                    });
                    */
                    break;
            }
        }
    };
});

app.directive('controlMultipleSelect', [function () {
    return {
        require: 'ngModel',
        template: '<ul><li ng-repeat="item in source track by $index" ng-click="add($index)" ng-class="{ active: has($index) }"><span ng-bind="item[label]"></span></li></ul>',
        scope: {
            source: '=controlMultipleSelect',
            label: '@',
            key: '@',
        },
        link: function (scope, element, attributes, controller) {
            scope.add = function (index) {
                var model = scope.$parent.$eval(attributes.ngModel);
                if (model) {
                    var indexOf = scope.indexOf(index);
                    if (indexOf !== -1) {
                        model.splice(indexOf, 1);
                    } else {
                        if (attributes.number === 'true') {
                            model.push(scope.source[index][scope.key]);
                        } else {
                            model.push(scope.source[index]);
                        }
                    }
                }
            };
            scope.indexOf = function (index) {
                var indexOf = -1;
                var model = scope.$parent.$eval(attributes.ngModel);
                if (model) {
                    angular.forEach(model, function (item, i) {
                        if (attributes.number === 'true') {
                            if (item === scope.source[index][scope.key]) {
                                indexOf = i;
                            }
                        } else if (item[scope.key] === scope.source[index][scope.key]) {
                            indexOf = i;
                        }
                    });
                }
                return indexOf;
            }
            scope.has = function (index) {
                var indexOf = scope.indexOf(index);
                return indexOf !== -1;
            }
            element.on('click', function () {
                element.addClass('active');
            })
        }
    };
}]);

app.directive('switcher', ['$timeout', '$sce', function ($timeout, $sce) {
    var uid = 0;

    return {
        restrict: 'EA',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            valueTrue: '=?',
            valueFalse: '=?',
            labelTrue: '@?',
            labelFalse: '@?',
            change: '=?ngChange',
            isDisabled: '=?ngDisabled',
        },
        template: function (element, attributes) {
            var name = attributes.name || 'switcher' + (++uid);
            return '<div class="switcher" ng-class="{ active: isActive, disabled: isDisabled }">' +
                    '   <span class="switcher-label false" ng-bind-html="trust(labelFalse)" ng-click="SetSwitch(false)"></span>' +
                    '   <label class="switcher-line">' +
                    '       <input id="' + name + '" name="' + name + '" type="checkbox" ng-model="isActive" ng-disabled="isDisabled" ng-change="onChange()">' +
                    '   </label>' +
                    '   <span class="switcher-label true" ng-bind-html="trust(labelTrue)" ng-click="SetSwitch(true)"></span>' +
                    '</div>';
        },
        link: function (scope, element, attributes, controller) {

            var input = element[0].querySelector('input');

            var properties = {
                valueTrue: true,
                valueFalse: false,
                isDisabled: false,
            };

            var attrs = {
                labelTrue: 'On',
                labelFalse: 'Off',
            };

            angular.forEach(properties, function (value, key) {
                if (!angular.isDefined(scope[key])) {
                    scope[key] = value;
                }
            });

            angular.forEach(attrs, function (value, key) {
                if (!angular.isDefined(scope[key])) {
                    attributes[key] = value;
                }
            });

            scope.trust = function (value) {
                return $sce.trustAsHtml(value);
            };

            scope.SetSwitch = function (value) {
                console.log('switcher.set', value);
                if (scope.isDisabled || input.checked == value) {
                    return;
                }
                scope.isActive = input.checked = value;
                scope.onChange();
            };

            scope.onChange = function () {
                console.log('switcher.onChange', input.checked, scope.change);
                var oldValue = scope.model;
                var newValue = input.checked ? scope.valueTrue : scope.valueFalse; // scope.isActive
                scope.model = newValue;
                if (angular.isFunction(scope.change)) {
                    $timeout(function () {
                        scope.change(newValue, oldValue);
                    });
                }
            };

            scope.$watch('model', function (newValue) {
                console.log('switcher.model', newValue);
                scope.isActive = (newValue == scope.valueTrue);
                if (input.checked !== scope.isActive) {
                    input.checked = scope.isActive;
                }
            });

            /*
            scope.$watch('isActive', function (newValue) {
                console.log('switcher.isActive', newValue);
                scope.model = scope[scope.isActive + 'Value'];
            });
            */
        },
    };

}]);

app.directive('control', ['$parse', function ($parse) {
    var uid = 0;
    return {
        restrict: 'A',
        replace: true,
        template: function (element, attributes) {
            var form = attributes.form || 'Form';
            var title = attributes.title || 'Untitled';
            var placeholder = attributes.placeholder || title;
            var name = title.replace(/[^0-9a-zA-Z]/g, "").split(' ').join('') + (++uid);
            var formKey = form + '.' + name;
            var formFocus = ' ng-focus="' + formKey + '.hasFocus=true"';
            var formBlur = ' ng-blur="' + formKey + '.hasFocus=false"';
            var formLeave = ' ng-mouseleave="' + formKey + '.hasFocus=false"';
            var formEvents = formFocus + formBlur;
            var required = '';
            var label = (attributes.label ? attributes.label : 'name');
            var key = (attributes.key ? attributes.key : 'id');
            var model = attributes.model;
            if (attributes.required) {
                required = '<span ng-messages="' + (attributes.readonly ? '' : '(' + form + '.$submitted || ' + formKey + '.$touched) && ') + form + '.' + name + '.$error" role="alert"><span ng-message="required" class="label-error animated flash"> &larr; required</span>';
                switch (attributes.control) {
                    case 'password':
                        required = required + '<span ng-message="minlength" class="label-error animated flash"> &larr; at least 6 chars</span>';
                        break;
                    case 'email':
                        required = required + '<span ng-message="email" class="label-error animated flash"> &larr; incorrect</span>';
                        break;
                    case 'number':
                        required = required + '<span ng-message="number" class="label-error animated flash"> &larr; enter a valid number</span>';
                        break;
                }
                if (attributes.match !== undefined) {
                    required = required + '<span ng-message="match" class="label-error animated flash"> &larr; not matching</span>';
                }
                required = required + '</span>';
            } else {
                required = attributes.control !== 'switch' ? ' (optional)' : '';
            }
            var template = '<div ' + (attributes.readonly ? ' class="readonly" ' : '') + ' ng-class="{ focus: ' + formKey + '.hasFocus, success: ' + formKey + '.$valid, error: ' + formKey + '.$invalid && (form.$submitted || ' + formKey + '.$touched), empty: !' + formKey + '.$viewValue }"><label for="' + name + '" class="control-label">' + title + required + '</label>';
            switch (attributes.control) {
                case 'switch':
                    template += '<div class="switcher" switcher name="' + name + '" ng-model="' + model + '" value-true="' + attributes.value + '" label-true="" label-false=""' + (attributes.onChanged ? ' ng-change="' + attributes.onChanged + '"' : '') + '></switcher>';
                    return template;
                    break;
                case 'checkbox':
                    template = '<div class="checkbox">';
                    template += '<span class="checkbox-label">' + title + required + '</span>';
                    template += '<span class="switch"><input id="' + name + '" name="' + name + '" type="checkbox" ng-model="' + model + '" ' + (attributes.required ? 'required="true"' : '') + ' class="toggle toggle-round-flat"><label for="' + name + '"></label></span>';
                    template += '</div>';
                    break;
                case 'select':
                    var options = attributes.number
                        ? 'item.' + key + ' as item.' + label + ' for item in ' + attributes.source
                        : 'item.' + label + ' for item in ' + attributes.source + ' track by item.' + key;
                    template += '<select name="' + name + '" class="form-control" ng-model="' + model + '" ng-options="' + options + '" ' + (attributes.number ? 'convert-to-number' : '') + ' ' + (attributes.required ? 'required="true"' : '') + '><option value="" disabled selected hidden>' + placeholder + '</option></select>';
                    break;
                case 'multiple-select':
                    /*
                    var options = attributes.number
                        ? 'item.' + key + ' as item.' + label + ' for item in ' + attributes.source
                        : 'item.' + label + ' for item in ' + attributes.source + ' track by item.' + key;
                    template += '<select name="' + name + '" class="form-control multiple" ng-model="' + model + '" ng-options="' + options + '" ' + (attributes.number ? 'convert-to-number' : '') + ' ' + (attributes.required ? 'required="true"' : '') + ' multiple="true"><option value="" disabled selected hidden>' + placeholder + '</option></select>';
                    */
                    var value = attributes.number ? 'item.' + key : 'item';
                    var options = attributes.number
                        ? 'item.' + key + ' as item.' + label + ' for item in ' + attributes.source
                        : 'item.' + label + ' for item in ' + attributes.source + ' track by item.' + key;
                    // template += '<select name="' + name + '" class="form-control multiple" ng-model="' + model + '" ng-options="' + options + '" ' + (attributes.number ? 'convert-to-number' : '') + ' ' + (attributes.required ? 'required="true"' : '') + ' multiple="true"><option value="" disabled selected hidden>' + placeholder + '</option></select>';                    
                    template += '<div ' + formLeave + '>';
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '" validate-type="array" placeholder="' + placeholder + '" type="data" readonly ' + formFocus + '>';
                    template += '<div control-multiple-select="' + attributes.source + '" ng-model="' + model + '" label="' + label + '" key="' + key + '" number="' + Boolean(attributes.number) + '" ' + (attributes.all ? 'all="true"' : '') + '></div>';
                    template += '</div>';
                    break;
                case 'autocomplete':
                    var canCreate = (attributes.canCreate ? attributes.canCreate : false);
                    var flatten = (attributes.flatten ? attributes.flatten : false);
                    var queryable = (attributes.queryable ? attributes.queryable : false);
                    var onSelected = (attributes.onSelected ? ' on-selected="' + attributes.onSelected + '"' : '');
                    template += '<input name="' + name + '" ng-model="' + model + '" type="hidden" ' + (attributes.required ? 'required' : '') + '>';
                    template += '<div control-autocomplete="' + attributes.source + '" model="' + model + '" label="' + label + '"  key="' + key + '" can-create="' + canCreate + '" flatten="' + flatten + '" queryable="' + queryable + '" placeholder="' + placeholder + '" on-focus="' + formKey + '.hasFocus=true" on-blur="' + formKey + '.hasFocus=false"' + onSelected + '></div>';
                    break;
                case 'textarea':
                    template += '<textarea name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" ' + (attributes.required ? 'required' : '') + ' rows="' + (attributes.rows ? attributes.rows : '1') + '"' + formEvents + '></textarea>';
                    break;
                case 'datetime-local':
                    placeholder == title ? placeholder = 'yyyy-MM-ddTHH:mm:ss' : null;
                    // placeholder="yyyy-MM-ddTHH:mm:ss" min="2001-01-01T00:00:00" max="2013-12-31T00:00:00" 
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" type="datetime-local"' + (attributes.required ? ' required' : '') + (attributes.readonly ? ' readonly' : '') + formEvents + '>';
                    break;
                case 'password':
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" type="password" ng-minlength="6" ' + (attributes.required ? 'required' : '') + formEvents + '>';
                    break;
                case 'email':
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" type="email" ' + (attributes.required ? 'required' : '') + formEvents + '>';
                    break;
                case 'number':
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" type="text"' + (attributes.required ? ' required' : '') + (attributes.readonly ? ' readonly' : '') + formEvents + ' validate-type="number">'; // ' validator="{ number: isNumber }">';
                    break;
                case 'text':
                default:
                    template += '<input name="' + name + '" class="form-control" ng-model="' + model + '"' + (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '') + ' placeholder="' + placeholder + '" type="text"' + (attributes.required ? ' required' : '') + (attributes.readonly ? ' readonly' : '') + formEvents + '>';
                    break;
            }
            template + '</div>';
            /* DEBUG 
            template += '<div>name <span>' + name + '</span></div>';
            template += '<div>formKey <span>' + formKey + '</span></div>';
            template += '<div>$valid <span ng-bind="' + formKey + '.$valid"></span></div>';
            template += '<div>$invalid <span ng-bind="' + formKey + '.$invalid"></span></div>';
            template += '<div>$viewValue <span ng-bind="' + formKey + '.$viewValue"></span></div>';
            template += '<div>$modelValue <span ng-bind="' + formKey + '.$modelValue"></span></div>';
            */
            return template;
        },
        link: function (scope, element, attributes, model) {

        },
    };
}]);

app.directive('controlAutocomplete', ['$parse', '$window', '$timeout', function ($parse, $window, $timeout) {

    var MAX_ITEMS = 5;

    return {
        restrict: 'A',
        scope: {
            service: '=controlAutocomplete',
            canCreate: '=',
            flatten: '=',
            queryable: '=',
            model: '=',
            label: '@',
            key: '@',
        },
        template: function (element, attributes) {
            var template = '<div>';
            template += '   <input class="form-control" ng-model="phrase" ng-model-options="{ debounce: 150 }" placeholder="' + attributes.placeholder + '" type="text" ng-focus="onFocus()">';
            template += '   <ul class="form-autocomplete" ng-show="items.length">';
            template += '       <li ng-repeat="item in items" ng-class="{ active: active == $index }" ng-click="onSelect(item)">';
            template += '           <span>{{item.NameA}}<span class="token">{{item.NameB}}</span>{{item.NameC}}</span>';
            template += '       </li>';
            template += '   </ul>';
            template += '</div>';
            return template;
        },
        link: function (scope, element, attributes, model) {

            var onSelected = $parse(attributes.onSelected);

            // console.log ('onSelected', onSelected);

            var input = element.find('input');
            var label = (scope.label ? scope.label : 'name');
            var key = (scope.key ? scope.key : 'id');

            function getPhrase() {
                if (scope.model) {
                    return scope.flatten ? scope.model : scope.model[label];
                } else {
                    return null;
                }
            }

            scope.phrase = getPhrase();
            scope.count = 0;
            scope.items = [];
            scope.active = -1;
            scope.maxItems = scope.maxItems || Number.POSITIVE_INFINITY;

            function Clear(phrase) {
                scope.items.length = 0;
                scope.count = 0;
                scope.phrase = phrase || null;
                input.val(scope.phrase);
            }

            function Current() {
                var current = null;
                if (scope.active != -1 && scope.items.length > scope.active) {
                    current = scope.items[scope.active];
                }
                return current;
            }

            scope.onFocus = function () {
                if (attributes.onFocus !== undefined) {
                    scope.$parent.$eval(attributes.onFocus);
                }
                if (input.val() === getPhrase()) {
                    input.val(null);
                }
            };

            scope.onBlur = function () {
                if (attributes.onBlur !== undefined) {
                    scope.$parent.$eval(attributes.onBlur);
                }
                Clear(getPhrase());
            };

            scope.onSelect = function (item) {
                if (scope.queryable) {
                    scope.service.setItem(item).then(function (parsedItem) {
                        onSelected({ $item: parsedItem }, scope.$parent, { $event: {} });
                        $timeout(function () {
                            if (scope.flatten) {
                                scope.model = parsedItem[key];
                            } else {
                                scope.model = scope.model || {};
                                angular.extend(scope.model, parsedItem);
                            }
                            scope.onBlur();
                        }, 1);
                    });
                } else {
                    onSelected({ $item: item }, scope.$parent, { $event: {} });
                    if (scope.flatten) {
                        scope.model = item[key];
                    } else {
                        scope.model = scope.model || {};
                        angular.extend(scope.model, item);
                    }
                    scope.onBlur();
                }
            };

            function onTyping(phrase) {
                if (scope.canCreate) {
                    if (scope.flatten) {
                        if (key === label) {
                            scope.model = phrase;
                        }
                    } else {
                        scope.model = {};
                        scope.model[label] = phrase;
                    }
                }
                // console.log(scope.model);
            };

            function Enter() {
                var item = Current();
                if (item) {
                    scope.onSelect(item);
                }
                scope.$apply();
            }

            function Up() {
                scope.active--;
                if (scope.active < 0) {
                    scope.active = scope.items.length - 1;
                }
                scope.$apply();
            }

            function Down() {
                scope.active++;
                if (scope.items.length == 0) {
                    scope.active = -1;
                } else if (scope.active >= scope.items.length) {
                    scope.active = 0;
                }
                scope.$apply();
            }

            function Parse(data) {
                scope.items = data.items;
                scope.count = data.count;
                angular.forEach(scope.items, function (value, index) {
                    var name = value[label];
                    var i = name.toLowerCase().indexOf(scope.phrase.toLowerCase());
                    value.NameA = name.substr(0, i);
                    value.NameB = name.substr(i, scope.phrase.length);
                    value.NameC = name.substr(i + scope.phrase.length, name.length - (i + scope.phrase.length));
                });
            }

            function Filter(data) {
                var c = 0, i = [];
                if (scope.phrase.length > 1) {
                    angular.forEach(data.items, function (value, index) {
                        var name = value[label];
                        if (name.toLowerCase().indexOf(scope.phrase.toLowerCase()) !== -1) {
                            if (i.length < MAX_ITEMS) {
                                i.push(value);
                            }
                            c++;
                        }
                    });
                }
                Parse({
                    count: c,
                    items: i
                });
            }

            function Search() {
                scope.phrase = input.val();
                scope.active = -1;
                onTyping(scope.phrase);
                if (scope.queryable) {
                    scope.service.setPhrase(scope.phrase).then(function (success) {
                        scope.items = success.items;
                        scope.count = success.count;
                    }, function (error) {
                        console.log('Search.queryable.error', scope.phrase, error);
                    }).finally(function () {

                    });
                } else {
                    Filter({
                        count: scope.service.length,
                        items: scope.service
                    });
                    scope.$apply();
                }
            }

            function onKeyDown(e) {
                switch (e.keyCode) {
                    case 9: // Tab
                    case 13: // Enter                        
                        Enter();
                        if (scope.items.length) {
                            e.preventDefault ? e.preventDefault() : null;
                            return false;
                        }
                        break;
                    case 38:
                        // Up
                        Up();
                        break;
                    case 40:
                        // Down
                        Down();
                        break;
                }
            }
            function onKeyUp(e) {
                switch (e.keyCode) {
                    case 9: // Tab
                    case 13: // Enter     
                        break;
                    case 39:
                        // Right
                        break;
                    case 37:
                        // Left
                        break;
                    case 38:
                        // Up
                        break;
                    case 40:
                        // Down
                        break;
                    default:
                        // Text
                        Search.call(this);
                        break;
                }
            }
            function onUp(e) {
                if (e.type == 'touchend') {
                    angular.element($window).off('mouseup', onUp);
                }
                if (Utils.getClosest(e.target, '[control-autocomplete]') === null) {
                    scope.$apply(function () {
                        // console.log('onUp');
                        scope.onBlur();
                    });
                }
                return true;
            }

            function addListeners() {
                input.on('keydown', onKeyDown);
                input.on('keyup', onKeyUp);
                angular.element($window).on('mouseup touchend', onUp);
            };
            function removeListeners() {
                input.off('keydown', onKeyDown);
                input.off('keyup', onKeyUp);
                angular.element($window).off('mouseup touchend', onUp);

            };
            scope.$on('$destroy', function () {
                removeListeners();
            });

            var init = false;
            function Init() {
                if (!init) {
                    addListeners();
                    init = true;
                }
            }

            scope.$watch('service', function (newValue) {
                if (newValue && (newValue.length || scope.queryable)) {
                    Init();
                }
            });

            scope.$watchCollection('model', function (newValue) {
                // console.log('controlAutocomplete.$watchCollection.model', newValue);
                if (newValue) {
                    if (scope.flatten && label === key) {
                        scope.phrase = newValue;
                        input.val(scope.phrase);
                    } else if (newValue[label]) {
                        scope.phrase = newValue[label];
                        input.val(scope.phrase);
                    }
                }
            });

        },
    };
}]);

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

/*global angular */

app.factory('Models', ['$q', '$http', 'Model', function ($q, $http, Model) {
    function Models() {
    }
    Models.get = function () {
        var deferred = $q.defer();
            $http.get(APP.API + '/api/models').then(function success(response) {
            var models = [];
            angular.forEach(response.data, function (data) {
                models.push(new Model(data));
            });
            deferred.resolve(models);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };
    return Models;
}]);

app.factory('AuthInterceptorService', ['$q', '$rootScope', '$window', '$location', 'LocalStorage', function ($q, $rootScope, $window, $location, LocalStorage) {
    return {
        isAuthorizedOrGoTo: function (redirect) {
            var deferred = $q.defer();
            var auth = LocalStorage.get('authorization');
            if (auth && auth.created_at + auth.expires_in < new Date().getTime()) {
                deferred.resolve(auth);
            } else {
                deferred.reject({ status: 'unauthorized' });
                $location.path(redirect);
            }
            return deferred.promise;
        },
        isAuthorized: function () {
            var auth = LocalStorage.get('authorization');
            return (auth && auth.created_at + auth.expires_in < new Date().getTime());
        },
        request: function (config) {
            var auth = LocalStorage.get('authorization');
            if (auth && auth.created_at + auth.expires_in < new Date().getTime()) {
                config.headers = config.headers || {};
                config.headers.Authorization = 'Bearer ' + auth.access_token; // add your token from your service or whatever
            }
            // console.log('auth', auth, config.headers);
            return config;
        },
        response: function (response) {
            return response || $q.when(response);
        },
        responseError: function (error) {
            // your error handler
            switch (error.status) {
                case 400:
                    var errors = [];
                    if (error.data) {
                        errors.push(error.data.Message);
                        for (var key in error.data.ModelState) {
                            for (var i = 0; i < error.data.ModelState[key].length; i++) {
                                errors.push(error.data.ModelState[key][i]);
                            }
                        }
                    } else {
                        errors.push('Server error');
                    }
                    error.Message = errors.join(' ');
                    // warning !!
                    $rootScope.httpError = error;
                    $rootScope.$broadcast('onHttpInterceptorError', error);
                    break;
                case 404:
                    error.Message = "Not found";
                    $rootScope.httpError = error;
                    $rootScope.$broadcast('onHttpInterceptorError', error);
                    break;
                case 500:
                    // console.log('500',error);
                    $rootScope.httpError = error;
                    $rootScope.$broadcast('onHttpInterceptorError', error);
                    break;
                case 401:
                    LocalStorage.delete('authorization');
                    LocalStorage.delete('user');
                    $location.path('/signin');
                    break;
                    // status == 0 you lost connection
            }
            return $q.reject(error);
        },
        signOut: function () {
            LocalStorage.delete('authorization');
            LocalStorage.delete('user');
            LocalStorage.delete('CampagnoloToken');
            LocalStorage.delete('GoogleToken');
            LocalStorage.delete('StravaToken');
            LocalStorage.delete('FacebookToken');
            LocalStorage.delete('GarminToken');
        },
    };
}]);

/** USERS SERVICE **/
app.factory('Users', ['$q', '$http', '$httpAsync', '$location', '$timeout', 'APP', 'LocalStorage', 'AuthInterceptorService', 'User', function ($q, $http, $httpAsync, $location, $timeout, APP, LocalStorage, AuthInterceptorService, User) {

    // PRIVATE VARIABLE FOR CURRENT USER
    var _current = null;

    function Users() {
    }

    Users.prototype = {
    };

    Users.current = function () {
        return Users.get();
    };

    Users.set = function (user) {
        LocalStorage.set('user', user);
        _current = user ? new User(user) : null;
        APP.USER = _current;
        return _current;
    };

    Users.get = function () {
        if (_current !== null) {
            return _current;
        } else {
            var user = LocalStorage.get('user');
            if (user) {
                _current = new User(user);
                APP.USER = _current;
                return _current;
            } else {
                return null;
            }
        }
    };

    Users.getCurrentUser = function () {
        var deferred = $q.defer();
        if (_current) {
            deferred.resolve(_current);
        } else {
            $http.get(APP.API + '/api/v1/users/me').then(function success(response) {
                if (response && response.data) {
                    deferred.resolve(Users.set(response.data));
                } else {
                    deferred.resolve(Users.set(null));
                }
            }, function error(response) {
                deferred.reject(response);
            });
        }
        return deferred.promise;
    };

    Users.isAuthorizedOrGoTo = function (redirect) {
        var deferred = $q.defer();
        if (AuthInterceptorService.isAuthorized()) {
            Users.getCurrentUser().then(function (user) {
                if (user) {
                    deferred.resolve(user);
                } else {
                    deferred.reject();
                    $location.path(redirect);
                }
            }, function error(response) {
                deferred.reject(response);
                $location.path(redirect);
            });
        } else {
            deferred.reject(null);
            $location.path(redirect);
        }
        return deferred.promise;
    };

    Users.signOut = function () {
        var deferred = $q.defer();
        Users.set(null);
        AuthInterceptorService.signOut();
        deferred.resolve();
        return deferred.promise;
    };

    return Users;
}]);

/** DATA SOURCE **/

app.factory('DataFilter', [function () {
    function DataFilter(data) {
        /*
        this.dateFrom = null;
        this.dateTo = null;
        this.search = null;
        this.status = null;
        */
        data ? angular.extend(this, data) : null;
    }
    DataFilter.prototype = {
        getSearchParams: function (search) {
            var a = [];
            if (search) {
                for (var p in search) {
                    a.push({ name: p, value: search[p] });
                }
            }
            return a;
        },
        getParams: function (source, infinite) {
            var post = {}, value;
            for (var p in this) {
                if (p === 'dateFrom' ||
                    p === 'dateTo' ||
                    p === 'status') {
                    value = this[p];
                    if (value !== undefined) {
                        post[p] = value;
                    }
                } else if (p === 'search') {
                    post[p] = JSON.stringify(this.getSearchParams(this[p]), null, '');
                }
            }
            post.page = source.page;
            post.size = source.size;
            post.infinite = infinite;
            return post;
        },
    };
    return DataFilter;
}]);

app.factory('DataSource', ['$q', '$http', '$httpAsync', '$timeout', '$rootScope', 'DataFilter', function ($q, $http, $httpAsync, $timeout, $rootScope, DataFilter) {

    var PAGES_MAX = Number.POSITIVE_INFINITY;

    function DataSource(data) {
        this.busy = false;
        this.error = false;
        this.size = 10;
        this.maxPages = 10;
        this.rows = [];
        this.filters = {};
        this.service = {
            url: '/api/items/paging',
            resolve: function (items, rows) {
                angular.forEach(items, function (item) {
                    this.push(item);
                }, rows);
            },
        };
        data ? angular.extend(this, data) : null;
        this.filters = new DataFilter(this.filters);
        // FAKE SERVICE FOR TEST !!!
        if (this.service.uri.paging === false) {
            this.get = function (deferred, infinite) {
                this.busy = true;
                this.error = false;
                $timeout(function () {
                    infinite ? null : this.rows.length = 0;
                    this.service.resolve(this.rows);
                    this.page = 1;
                    this.pages = 2;
                    this.count = this.rows.length;
                    this.pagination = this.getPages();
                    this.busy = false;
                    $rootScope.$broadcast('onDataSourceUpdate', this);
                    deferred.resolve(this.rows);
                    // console.log('DataSource.get');                    
                }.bind(this), 1000);
            };
        }
        this.flush();
    }
    DataSource.prototype = {
        flush: function () {
            this.pages = PAGES_MAX;
            this.page = 1;
            this.count = 0;
            this.opened = null;
        },
        resolve: function (response) {
            var responseHeader = response.headers('X-Pagination');
            var responseView = responseHeader ? JSON.parse(responseHeader) : null;
            // console.log('response', response, 'responseHeader', responseHeader, 'responseView', responseView);
            if (responseView) {
                this.page = responseView.page;
                this.size = responseView.size;
                this.pages = responseView.pages;
                this.count = responseView.count;
            } else {
                this.page = 0;
                this.size = responseView.size;
                this.pages = 0;
                this.count = 0;
            }
            this.pagination = this.getPages();
        },
        get: function (deferred, infinite) {
            this.busy = true;
            this.error = false;
            $httpAsync.get(this.service.uri.paging, { params: this.filters.getParams(this) }).then(function success(response) {
                this.resolve(response);
                infinite ? null : this.rows.length = 0;
                this.service.resolve(response.data, this.rows);
                $rootScope.$broadcast('onDataSourceUpdate', this);
                deferred.resolve(this.rows);
            }.bind(this), function error(response) {
                console.log('DataSource.error', response);
                this.error = true;
                deferred.reject(response);
            }.bind(this))
                .finally(function () {
                    // console.log('DataSource.get');
                    $timeout(function () {
                        this.busy = false;
                    }.bind(this), 1000);
                }.bind(this));
        },
        paging: function () {
            var deferred = $q.defer();
            if (this.busy || this.page > this.pages) {
                deferred.reject();
            } else {
                // console.log('DataSource.paging');
                this.opened = null;
                this.get(deferred);
            }
            return deferred.promise;
        },
        refresh: function () {
            var deferred = $q.defer();
            if (this.busy) {
                deferred.reject();
            } else {
                // console.log('DataSource.refresh');
                this.flush();
                this.get(deferred);
            }
            return deferred.promise;
        },
        more: function () {
            var deferred = $q.defer();
            if (this.busy || this.page + 1 > this.pages) {
                deferred.reject();
            } else {
                // console.log('DataSource.more');
                this.page++;
                this.get(deferred, true);
            }
            return deferred.promise;
        },
        filter: function () {
            this.page = 1;
            this.pages = PAGES_MAX;
            this.paging();
        },
        prevPage: function () {
            var page = this.page - 1;
            if (page > 0 && page <= this.pages) {
                this.page = page;
                this.paging();
            }
        },
        nextPage: function () {
            var page = this.page + 1;
            if (page > 0 && page <= this.pages) {
                this.page = page;
                this.paging();
            }
        },
        gotoPage: function (page) {
            if (page > 0 && page <= this.pages) {
                this.page = page;
                this.paging();
            }
        },
        firstPage: function () {
            if (this.page !== 1) {
                this.page = 1;
                this.paging();
            }
        },
        lastPage: function () {
            if (this.page !== this.pages) {
                this.page = this.pages;
                this.paging();
            }
        },
        hasMany: function () {
            return this.count > 0 && this.pages > this.maxPages;
        },
        hasMorePagesBehind: function () {
            var startingIndex = Math.max(0, this.page - this.maxPages);
            return startingIndex > 0;
        },
        hasMorePagesNext: function () {
            var endingIndex = Math.max(0, this.page - this.maxPages) + this.maxPages;
            return endingIndex < this.pages;
        },
        isPage: function (number) {
            return this.page === number;
        },
        hasPages: function () {
            return this.pages > 0 && this.pages < PAGES_MAX;
        },
        getPages: function () {
            var a = [], i;
            if (this.hasPages()) {
                var startingIndex = Math.max(0, this.page - this.maxPages);
                var endingIndex = Math.min(this.pages, startingIndex + this.maxPages);
                i = startingIndex;
                while (i < endingIndex) {
                    a.push({ number: (i + 1) });
                    i++;
                }
            }
            return a;
        },
        openClose: function (index) {
            if (this.opened === index) {
                this.opened = null;
            } else {
                this.opened = index;
            }
        }
    };
    return DataSource;
}]);

/** INDEXED DATA SOURCE **/

app.factory('IndexedDataFilter', [function () {
    function IndexedDataFilter(data) {
        data ? angular.extend(this, data) : null;
    }
    IndexedDataFilter.prototype = {
        getSearchParams: function (search) {
            var a = [];
            if (search) {
                for (var p in search) {
                    a.push({ name: p, value: search[p] });
                }
            }
            return a;
        },
        getParams: function (source, infinite) {
            var post = {}, value;
            for (var p in this) {
                if (p === 'dateFrom' ||
                    p === 'dateTo' ||
                    p === 'status') {
                    value = this[p];
                    if (value !== undefined) {
                        post[p] = value;
                    }
                } else if (p === 'search') {
                    post[p] = JSON.stringify(this.getSearchParams(this[p]), null, '');
                }
            }
            post.page_index = source.page;
            post.page_size = source.size;
            return post;
        },
    };
    return IndexedDataFilter;
}]);

app.factory('IndexedDataSource', ['$q', '$http', '$httpAsync', '$timeout', '$rootScope', 'IndexedDataFilter', 'APP', function ($q, $http, $httpAsync, $timeout, $rootScope, IndexedDataFilter, APP) {

    var PAGES_MAX = Number.POSITIVE_INFINITY;

    function IndexedDataSource(data) {
        this.busy = false;
        this.error = false;
        this.size = 10;
        this.maxPages = 10;
        this.rows = [];
        this.filters = {};
        this.service = {
            url: '/api/items/paging',
            resolve: function (items, rows) {
                angular.forEach(items, function (item) {
                    this.push(item);
                }, rows);
            },
        };
        data ? angular.extend(this, data) : null;
        this.filters = new IndexedDataFilter(this.filters);
        // FAKE SERVICE FOR TEST !!!
        if (this.service.uri.paging === false) {
            this.get = function (deferred, infinite) {
                this.busy = true;
                this.error = false;
                $timeout(function () {
                    infinite ? null : this.rows.length = 0;
                    this.service.resolve(this.rows);
                    this.page = 1;
                    this.pages = 2;
                    this.count = this.rows.length;
                    this.pagination = this.getPages();
                    this.busy = false;
                    $rootScope.$broadcast('onIndexedDataSourceUpdate', this);
                    deferred.resolve(this.rows);
                    // console.log('IndexedDataSource.get');                    
                }.bind(this), 1000);
            };
        }
        this.flush();
    }
    IndexedDataSource.prototype = {
        flush: function () {
            this.pages = PAGES_MAX;
            this.page = 0;
            this.count = 0;
            this.opened = null;
        },
        resolve: function (response) {
            if (response && response.data) {
                this.count = response.data.count;
                this.pages = Math.ceil(this.count / this.size);
            } else {
                this.page = 0;
                this.pages = 0;
                this.count = 0;
            }
            this.pagination = this.getPages();
        },
        get: function (deferred, infinite) {
            this.busy = true;
            this.error = false;
            var url = this.service.uri.paging.split("##userId##").join(APP.USER.id);
            // $httpAsync.get(url, { params: this.filters.getParams(this) }).then(function success(response) {
            $http.get(url, { params: this.filters.getParams(this) }).then(function success(response) {
                this.resolve(response);
                infinite ? null : this.rows.length = 0;
                this.service.resolve(response.data.list, this.rows);
                $rootScope.$broadcast('onIndexedDataSourceUpdate', this);
                deferred.resolve(this.rows);
            }.bind(this), function error(response) {
                console.log('IndexedDataSource.error', response);
                this.error = true;
                deferred.reject(response);
            }.bind(this))
                .finally(function () {
                    // console.log('IndexedDataSource.get');
                    $timeout(function () {
                        this.busy = false;
                    }.bind(this), 1000);
                }.bind(this));
        },
        paging: function () {
            var deferred = $q.defer();
            if (this.busy || this.page >= this.pages) {
                deferred.reject();
            } else {
                // console.log('IndexedDataSource.paging');
                this.opened = null;
                this.get(deferred);
            }
            return deferred.promise;
        },
        refresh: function () {
            var deferred = $q.defer();
            if (this.busy) {
                deferred.reject();
            } else {
                // console.log('IndexedDataSource.refresh');
                this.flush();
                this.get(deferred);
            }
            return deferred.promise;
        },
        more: function () {
            var deferred = $q.defer();
            if (this.busy || this.page + 1 >= this.pages) {
                deferred.reject();
            } else {
                // console.log('IndexedDataSource.more');
                this.page++;
                this.get(deferred, true);
            }
            return deferred.promise;
        },
        filter: function () {
            this.page = 1;
            this.pages = PAGES_MAX;
            this.paging();
        },
        prevPage: function () {
            var page = this.page - 1;
            if (page >= 0 && page < this.pages) {
                this.page = page;
                this.paging();
            }
        },
        nextPage: function () {
            var page = this.page + 1;
            if (page >= 0 && page < this.pages) {
                this.page = page;
                this.paging();
            }
        },
        gotoPage: function (page) {
            if (page >= 0 && page < this.pages) {
                this.page = page;
                this.paging();
            }
        },
        firstPage: function () {
            if (this.page !== 0) {
                this.page = 0;
                this.paging();
            }
        },
        lastPage: function () {
            if (this.page !== Math.max(0, this.pages - 1)) {
                this.page = Math.max(0, this.pages - 1);
                this.paging();
            }
        },
        hasMany: function () {
            return this.count > 0 && this.pages > this.maxPages;
        },
        hasMorePagesBehind: function () {
            var startingIndex = Math.max(0, this.page - this.maxPages);
            return startingIndex > 0;
        },
        hasMorePagesNext: function () {
            var endingIndex = Math.max(0, this.page - this.maxPages) + this.maxPages;
            return endingIndex < this.pages;
        },
        isPage: function (number) {
            return this.page + 1 === number;
        },
        hasPages: function () {
            return this.pages > 0 && this.pages < PAGES_MAX;
        },
        getPages: function () {
            var a = [], i;
            if (this.hasPages()) {
                var startingIndex = Math.max(0, this.page - this.maxPages);
                var endingIndex = Math.min(this.pages, startingIndex + this.maxPages);
                i = startingIndex;
                while (i < endingIndex) {
                    a.push({ number: (i + 1) });
                    i++;
                }
            }
            return a;
        },
        openClose: function (index) {
            if (this.opened === index) {
                this.opened = null;
            } else {
                this.opened = index;
            }
        }
    };
    return IndexedDataSource;
}]);

/** TABS PROVIDER **/
app.factory('TabsProvider', ['Collection', function (Collection) {
    var TabsProvider = Collection.extend({
        init: function () {
            // console.log('TabsProvider.init', this);
            this.current = 0;
        },
        isIndex: function (index) {
            return this.current === index;
        },
        setIndex: function (index) {
            if (index >= 0 && index < this.length) {
                this.current = index;
            }
        },
        isValue: function (value) {
            return this[this.current].value === value;
        },
        setValue: function (value) {
            var index = this.indexOfValue(value);
            if (index !== -1) {
                this.current = index;
            }
        },
        indexOfValue: function (value) {
            var index = -1, i = 0, t = this.length;
            while (i < t) {
                if (this[i].value === value) {
                    index = i;
                    break;
                }
                i++;
            }
            return index;
        },
    });

    return TabsProvider;
}]);
app.factory('ListProvider', ['Collection', function (Collection) {
    var TabsProvider = Collection.extend({
        init: function () {
        },
        stringOfValues: function (key) {
            var _values = '', i = 0, t = this.length;
            while (i < t) {
                _values += (i > 0 ? ', ' : '') + this[i][key];
                i++;
            }
            return _values;
        },
        indexOfValue: function (value) {
            var index = -1, i = 0, t = this.length;
            while (i < t) {
                if (this[i].value === value) {
                    index = i;
                    break;
                }
                i++;
            }
            return index;
        },
        toString: function () {
            return this.stringOfValues('name');
        }
    });

    return TabsProvider;
}]);
app.factory('Collection', [function () {

    function Collection() {
        // console.log('Collection.constructor', this);
        var collection = Object.create(Array.prototype);
        collection = (Array.apply(collection, arguments) || collection);
        // Add all the class methods to the collection.
        this.constructor.inject(collection);
        collection.init();
        return (collection);
    }

    Collection.inject = function (collection) {
        for (var method in this.prototype) {
            // Make sure this is a local method.
            if (this.prototype.hasOwnProperty(method)) {
                collection[method] = this.prototype[method];
            }
        }
        return (collection);
    };

    Collection.extend = function (prototype) {
        var constructor = function () {
            return Collection.apply(this, arguments);
        }
        // statics
        angular.extend(constructor, this);
        // prototypes
        constructor.prototype = angular.extend({}, this.prototype, prototype);
        constructor.prototype.constructor = constructor;
        return constructor;
    };

    Collection.__extend = function (constructor, prototype) {
        // statics
        angular.extend(constructor, this);
        // prototypes
        constructor.prototype = angular.extend({}, this.prototype, prototype);
        constructor.prototype.constructor = constructor;
        return constructor;
    };

    Collection.fromArray = function (array) {
        var collection = Collection.apply(null, array);
        return (collection);
    };

    Collection.isArray = function (value) {
        var stringValue = Object.prototype.toString.call(value);
        return (stringValue.toLowerCase() === "[object array]");
    };

    Collection.prototype = {
        constructor: Collection,
        init: function () {
            // console.log('Collection.init', this);
        },
        add: function (value) {
            if (Collection.isArray(value)) {
                for (var i = 0 ; i < value.length ; i++) {
                    // Add the sub-item using default push() method.
                    Array.prototype.push.call(this, value[i]);
                }
            } else {
                // Use the default push() method.
                Array.prototype.push.call(this, value);
            }
            // Return this object reference for method chaining.
            return (this);
        },
        addAll: function () {
            // Loop over all the arguments to add them to the
            // collection individually.
            for (var i = 0 ; i < arguments.length ; i++) {
                this.add(arguments[i]);
            }
            // Return this object reference for method chaining.
            return (this);
        }
    };

    return (Collection);


    function ExtensibleObject(data) {
        data ? this.set(data) : null;
    }
    ExtensibleObject.prototype = {
        set: function (data) {
            angular.extend(this, data);
            this.init();
        },
        init: function () {
            console.log('ExtensibleObject.init');
        },
    };
    ExtensibleObject.extend = function (constructor, prototype) {
        // statics
        angular.extend(constructor, this);
        // constructor.$ = constructor.$ || this.$;
        // prototypes
        constructor.prototype = angular.extend(Object.create(this.prototype), prototype);
        constructor.prototype.constructor = constructor;
        // one new pool for each model
        // constructor.pool = {};
        return constructor;
    };
    ExtensibleObject.prototype.constructor = ExtensibleObject;
    return ExtensibleObject;
}]);
app.factory('ExtensibleObject', [function () {
    function ExtensibleObject(data) {
        data ? this.set(data) : null;
    }
    ExtensibleObject.prototype = {
        set: function (data) {
            angular.extend(this, data);
            this.init();
        },
        init: function () {
            console.log('ExtensibleObject.init');
        },
    };
    ExtensibleObject.extend = function (constructor, prototype) {
        // statics
        angular.extend(constructor, this);
        // constructor.$ = constructor.$ || this.$;
        // prototypes
        constructor.prototype = angular.extend(Object.create(this.prototype), prototype);
        constructor.prototype.constructor = constructor;
        // one new pool for each model
        // constructor.pool = {};
        return constructor;
    };
    ExtensibleObject.prototype.constructor = ExtensibleObject;
    return ExtensibleObject;
}]);

/** LOCALSTORAGE SERVICE **/
app.factory('Cookie', ['$q', '$window', function ($q, $window) {
    function Cookie() {
    }

    Cookie.TIMEOUT = 5 * 60 * 1000; // five minutes

    Cookie._set = function (name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        } else {
            var expires = "";
        }
        $window.document.cookie = name + "=" + value + expires + "; path=/";
    }

    Cookie.set = function (name, value, days) {
        try {
            var cache = [];
            var json = JSON.stringify(value, function (key, value) {
                if (key === 'pool') {
                    return;
                }
                if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        // Circular reference found, discard key
                        return;
                    }
                    cache.push(value);
                }
                return value;
            });
            cache = null;
            Cookie._set(name, json, days);
        } catch (e) {
            console.log('Cookie.set.error serializing', name, value, e);
        }
    };

    Cookie.get = function (name) {
        var cookieName = name + "=";
        var ca = $window.document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(cookieName) == 0) {
                var value = c.substring(cookieName.length, c.length);
                var data = null;
                try {
                    data = JSON.parse(value);
                } catch (e) {
                    console.log('Cookie.get.error parsing', key, e);
                };
                return data;
            }
        }
        return null;
    };

    Cookie.delete = function (name) {
        Cookie._set(name, "", -1);
    };

    Cookie.on = function (name) {
        var deferred = $q.defer();
        var i, interval = 1000, elapsed = 0, timeout = Cookie.TIMEOUT;
        function checkCookie() {
            if (elapsed > timeout) {
                deferred.reject('timeout');
            } else {
                var c = Cookie.get(name);
                if (c) {
                    deferred.resolve(c);
                } else {
                    elapsed += interval;
                    i = setTimeout(checkCookie, interval);
                }
            }
        }
        checkCookie();
        return deferred.promise;
    };

    return Cookie;
}]);
app.factory('LocalStorage', ['$q', '$window', 'Cookie', function ($q, $window, Cookie) {
    function LocalStorage() {
    }

    function isLocalStorageSupported() {
        var supported = false;
        try {
            supported = 'localStorage' in $window && $window['localStorage'] !== null;
            if (supported) {
                $window.localStorage.setItem('test', '1');
                $window.localStorage.removeItem('test');
            } else {
                supported = false;
            }
        } catch (e) {
            supported = false;
        }
        return supported;
    }
    LocalStorage.isSupported = isLocalStorageSupported();

    if (LocalStorage.isSupported) {
        LocalStorage.set = function (name, value) {
            try {
                var cache = [];
                var json = JSON.stringify(value, function (key, value) {
                    if (key === 'pool') {
                        return;
                    }
                    if (typeof value === 'object' && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            // Circular reference found, discard key
                            return;
                        }
                        cache.push(value);
                    }
                    return value;
                });
                cache = null;
                $window.localStorage.setItem(name, json);
            } catch (e) {
                console.log('LocalStorage.set.error serializing', name, value, e);
            }
        };

        LocalStorage.get = function (name) {
            var value = null;
            if ($window.localStorage[name] !== undefined) {
                try {
                    value = JSON.parse($window.localStorage[name]);
                } catch (e) {
                    console.log('LocalStorage.get.error parsing', name, e);
                }
            }
            return value;
        };

        LocalStorage.delete = function (name) {
            $window.localStorage.removeItem(name);
        };

        LocalStorage.on = function (name) {
            var deferred = $q.defer();
            var i, timeout = Cookie.TIMEOUT;
            function storageEvent(e) {
                // console.log('LocalStorage.on', name, e);
                clearTimeout(i);
                if (e.originalEvent.key == name) {
                    try {
                        var value = JSON.parse(e.originalEvent.newValue); // , e.originalEvent.oldValue
                        deferred.resolve(value);
                    } catch (e) {
                        console.log('LocalStorage.on.error parsing', name, e);
                        deferred.reject('error parsing ' + name);
                    }
                }
            }
            angular.element($window).on('storage', storageEvent);
            i = setTimeout(function () {
                deferred.reject('timeout');
            }, timeout);
            return deferred.promise;
        };

    } else {
        console.log('LocalStorage.unsupported switching to cookies');
        LocalStorage.set = Cookie.set;
        LocalStorage.get = Cookie.get;
        LocalStorage.delete = Cookie.delete;
        LocalStorage.on = Cookie.on;

    }

    return LocalStorage;
}]);
app.factory('WebWorker', ['$q', '$http', function ($q, $http) {
    var isWebWorkerSupported = (typeof (Worker) !== "undefined");
    if (!isWebWorkerSupported) {
        window.Worker = function () {
            function Worker(src) {
                var self = this;
                $http.get(src, { transformResponse: function (d, h) { return d } }).then(function success(response) {
                    try {
                        eval('self.o = function(){ function postMessage(e) { self.onmessage({data:e}); }\n ' + response.data + ' };');
                        self.object = new self.o();
                        self.object.postMessage = function (e) {
                            self.onmessage({ data: e });
                        }
                    } catch (e) {
                        console.log("Worker error ", e);
                    }
                }, function error(response) {
                    console.log("Worker not found");
                });
            }
            Worker.prototype = {
                onmessage: function (e) {
                    console.log('Worker not implemented');
                },
                postMessage: function (e) {
                    this.object.onmessage({ data: e });
                }
            }
            return Worker;
        }();
    }
    function WebWorker(src) {
        var self = this;
        this.callbacks = {};
        this.id = 0;
        this.worker = new Worker(src);
        this.worker.onmessage = function (e) {
            self.onmessage(e);
        };
    }
    WebWorker.prototype = {
        parse: function (e) {
            return JSON.parse(e.data);
        },
        stringify: function (data) {
            return JSON.stringify(data);
        },
        onmessage: function (e) {
            var data = this.parse(e);
            var deferred = this.callbacks[data.id];
            if (data.status !== -1) {
                deferred.resolve(data);
            } else {
                deferred.reject(data);
            }
            delete this.callbacks[data.id];
        },
        post: function (data) {
            var deferred = $q.defer();
            data.id = this.id;
            this.callbacks[this.id.toString()] = deferred;
            this.id++;
            this.worker.postMessage(this.stringify(data));
            return deferred.promise;
        },
    };
    WebWorker.isSupported = isWebWorkerSupported;
    return WebWorker;
}]);
app.factory('$httpAsync', ['$q', '$http', function ($q, $http) {
    var isWebWorkerSupported = (typeof (Worker) !== "undefined");
    if (!isWebWorkerSupported) {
        return $http;
    }
    var worker = new Worker('/Scripts/app/workers/http.js');
    var callbacks = {};
    var id = 0;
    var lowercase = function (string) { return isString(string) ? string.toLowerCase() : string; };
    var trim = function (value) {
        return isString(value) ? value.trim() : value;
    };
    function $httpAsync(options) {
        var deferred = $q.defer();
        var wrap = getDefaults(options);
        wrap.id = id.toString();
        // console.log('wrap', wrap);
        /*
        var xsrfValue = urlIsSameOrigin(config.url)
            ? $$cookieReader()[config.xsrfCookieName || defaults.xsrfCookieName]
            : undefined;
        if (xsrfValue) {
          reqHeaders[(config.xsrfHeaderName || defaults.xsrfHeaderName)] = xsrfValue;
        }
        $httpBackend(config.method, url, reqData, done, reqHeaders, config.timeout,
            config.withCredentials, config.responseType);
        */
        callbacks[wrap.id] = deferred;
        id++;
        worker.postMessage($httpAsync.stringify(wrap));
        return deferred.promise;
    }
    $httpAsync.get = function (url, config) {
        return $httpAsync(angular.extend({}, config || {}, {
            method: 'GET',
            url: url
        }));
    };
    $httpAsync.delete = function (url, config) {
        return $httpAsync(angular.extend({}, config || {}, {
            method: 'DELETE',
            url: url
        }));
    };
    $httpAsync.head = function (url, config) {
        return $httpAsync(angular.extend({}, config || {}, {
            method: 'HEAD',
            url: url
        }));
    };
    $httpAsync.post = function (url, data, config) {
        return $httpAsync(angular.extend({}, config || {}, {
            method: 'POST',
            data: data,
            url: url
        }));
    };
    $httpAsync.put = function (url, data, config) {
        return $httpAsync(angular.extend({}, config || {}, {
            method: 'PUT',
            data: data,
            url: url
        }));
    };
    $httpAsync.patch = function (url, data, config) {
        return $httpAsync(angular.extend({}, config || {}, {
            method: 'PATCH',
            data: data,
            url: url
        }));
    };
    $httpAsync.parse = function (e) {
        return JSON.parse(e.data);
    };
    $httpAsync.stringify = function (data) {
        return JSON.stringify(data);
    };
    $httpAsync.isSupported = isWebWorkerSupported;
    worker.onmessage = function (e) {
        var wrap = $httpAsync.parse(e);
        // console.log('onmessage', wrap);
        var deferred = callbacks[wrap.id];
        var status = wrap.status >= -1 ? wrap.status : 0;
        var getter = headersGetter(wrap.response.headers);
        (isSuccess(status) ? deferred.resolve : deferred.reject)({
            data: wrap.response.data, // !!!! JSON.parse(wrap.response.data),
            headers: getter,
            status: wrap.response.status,
            statusText: wrap.response.statusText,
            config: wrap.config,
        });
        delete callbacks[wrap.id];
    }
    return $httpAsync;
    function isSuccess(status) {
        return 200 <= status && status < 300;
    }
    function createMap() {
        return Object.create(null);
    }
    function isString(value) { return typeof value === 'string'; }
    function parseHeaders(headers) {
        var parsed = createMap(), i;
        function fillInParsed(key, val) {
            if (key) {
                parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
            }
        }
        if (isString(headers)) {
            var a = headers.split('\n');
            for (var j = 0; j < a.length; j++) {
                var line = a[j];
                i = line.indexOf(':');
                fillInParsed(lowercase(trim(line.substr(0, i))), trim(line.substr(i + 1)));
            }
        } else if (isObject(headers)) {
            for (var p in headers) {
                fillInParsed(lowercase(p), trim(headers[p]));
            }
        }
        return parsed;
    }
    function headersGetter(headers) {
        var headersObj;
        return function (name) {
            if (!headersObj) headersObj = parseHeaders(headers);
            if (name) {
                var value = headersObj[lowercase(name)];
                if (value === void 0) {
                    value = null;
                }
                return value;
            }
            return headersObj;
        };
    }
    function getDefaults(options) {
        var defaults = {
            method: 'GET',
            withCredentials: false,
            responseType: 'json',
            headers: {},
            config: {}
        }
        defaults.withCredentials = $http.defaults.withCredentials;
        angular.extend(defaults.headers, $http.defaults.headers.common);
        var method = (options.method || defaults.method).toLowerCase();
        if ($http.defaults.headers[method]) {
            angular.extend(defaults.headers, $http.defaults.headers[method]);
        }
        // console.log('defaults', $http.defaults);
        // defaults = angular.extend(defaults, $http.defaults);        
        /*
    method{string}:                     HTTP method (e.g. 'GET', 'POST', etc)
    url:{string}:                       Absolute or relative URL of the resource that is being requested.
    params:{Object.<string|Object>}:    Map of strings or objects which will be serialized with the paramSerializer and appended as GET parameters.
    
    data:{string|Object}:               Data to be sent as the request message data.
    headers:{Object}:                   Map of strings or functions which return strings representing HTTP headers to send to the server. If the return value of a function is null, the header will not be sent. Functions accept a config object as an argument.
    
    xsrfHeaderName:{string}:            Name of HTTP header to populate with the XSRF token.
    xsrfCookieName:{string}:            Name of cookie containing the XSRF token.
    transformRequest:{function(data, headersGetter)|Array.<function(data, headersGetter)>}:         transform function or an array of such functions. The transform function takes the http request body and headers and returns its transformed (typically serialized) version. See Overriding the Default Transformations
    
    transformResponse:{function(data, headersGetter, status)|Array.<function(data, headersGetter, status)>}:    transform function or an array of such functions. The transform function takes the http response body, headers and status and returns its transformed (typically deserialized) version. See Overriding the Default TransformationjqLiks
    
    paramSerializer:{string|function(Object<string,string>):string}:        A function used to prepare the string representation of request parameters (specified as an object). If specified as string, it is interpreted as function registered with the $injector, which means you can create your own serializer by registering it as a service. The default serializer is the $httpParamSerializer; alternatively, you can use the $httpParamSerializerJQLike
    
    cache:{boolean|Cache}:              If true, a default $http cache will be used to cache the GET request, otherwise if a cache instance built with $cacheFactory, this cache will be used for caching.
    
    timeout:{number|Promise}:           timeout in milliseconds, or promise that should abort the request when resolved.
    withCredentials:{boolean}:          whether to set the withCredentials flag on the XHR object. See requests with credentials for more information.
    
    responseType:{string}:              see XMLHttpRequest.responseType.
        */
        options ? options = angular.extend(defaults, options) : defaults;
        return options;
    }
}]);
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
