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
