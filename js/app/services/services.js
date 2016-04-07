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