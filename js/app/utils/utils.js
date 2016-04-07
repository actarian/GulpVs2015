
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