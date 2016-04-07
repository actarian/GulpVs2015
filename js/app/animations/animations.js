
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
