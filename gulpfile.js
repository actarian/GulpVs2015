/// <binding ProjectOpened='start' />
'use strict';


/****************
 *** REQUIRES ***
 ****************/
var gulp = require('gulp'),
    fs = require('fs'),
    promise = require('es6-promise'),
    del = require('del'),
    rewrite = require('connect-modrewrite'),
    webserver = require('gulp-webserver'),
    rename = require('gulp-rename'),
    plumber = require('gulp-plumber'),
    concat = require('gulp-concat'),
    cssmin = require('gulp-cssmin'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    sourcemaps = require('gulp-sourcemaps'),
    jade = require('gulp-jade'),
    typescript = require('gulp-typescript'),
    less = require('gulp-less'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer');


/****************
 *** DEFAULTS ***
 ****************/
var defaults = {};


/*****************
 *** VARIABLES ***
 *****************/
var config = JSON.parse(fs.readFileSync('./config.json'));
for (var p in defaults) {
    config[p] = config[p] || defaults[p];
}
var paths = config.paths;
var folders = config.folders;
var bundles = config.bundles;
var browserlist = config.browserlist;
var server = config.server;


/****************
 *** PATTERNS ***
 ****************/
var matches = {
    everything: '/**/*.*',
    less: '/**/*.less',
    sass: '/**/*.scss',
    css: '/**/*.css',
    js: '/**/*.js',
    typescript: '/**/*.ts',
    jade: '/**/*.jade',    
};
var excludes = {
    everything: '/**/*.*',
    less: "/**/_*.less",
    sass: "/**/_*.scss",
    css: "/**/*.min.css",
    js: "/**/*.min.js"
};


/************
 *** JADE ***
 ************/
gulp.task('jade:compile', function() {
    var options = {
        locals: {},
        pretty: true,
    };
    return gulp.src(paths.src + matches.jade)
        .pipe(plumber(function(error) {
            console.log('jade:compile.plumber', error);
        }))
        .pipe(jade(options))
        .pipe(gulp.dest(paths.root));
});
gulp.task('jade:watch', function() {
    var watcher = gulp.watch(paths.src + matches.jade, ['jade:compile']);
    watcher.on('change', function(e) {
        console.log('watcher.on.change type: ' + e.type + ' path: ' + e.path);
    });
    return watcher;
});
gulp.task('jade', ['jade:compile', 'jade:watch']);


/******************
 *** TYPESCRIPT ***
 ******************/
var project = typescript.createProject('tsconfig.json', {
    typescript: require('typescript')
});
gulp.task('typescript:compile', function() {
    var result = project.src().pipe(typescript(project));
    return result.js
        .pipe(plumber(function(error) {
            console.log('typescript:compile.plumber', error);
        }))
        .pipe(gulp.dest(paths.root)) // save .js
        .pipe(sourcemaps.init())
        .pipe(uglify({ preserveComments: 'license' }))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(paths.root)) // save .min.js
        .pipe(sourcemaps.write('.')); // save .map        
});
gulp.task('typescript:watch', function() {
    var watcher = gulp.watch(paths.src + matches.typescript, ['typescript:compile']);
    watcher.on('change', function(e) {
        console.log('watcher.on.change type: ' + e.type + ' path: ' + e.path);
    });
    return watcher;
});
gulp.task('typescript', ['typescript:compile', 'typescript:watch']);


/************
 *** LESS ***
 ************/
gulp.task('less:compile', function() {
    console.log('less:compile COMPILING!');
    return gulp.src([
        paths.src + matches.less,
        '!' + paths.src + excludes.less,
        '!' + paths.node + excludes.everything,
    ], { base: paths.src })
        .pipe(plumber(function (error) {
            console.log('less:compile.plumber', error);
        }))
        .pipe(sourcemaps.init())
        .pipe(less().on('less:compile.error', function (error) {
            console.log(error);
        }))
        .pipe(sourcemaps.write()) // save .map        
        .pipe(autoprefixer({ browsers: browserlist })) // autoprefixer
        .pipe(gulp.dest(paths.root)) // save .css
        .pipe(cssmin())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest(paths.root)); // save .min.css
});
gulp.task('less:watch', function() {
    var watcher = gulp.watch(paths.src + matches.less, ['less:compile']);
    watcher.on('change', function(e) {
        console.log('watcher.on.change type: ' + e.type + ' path: ' + e.path);
    });
    return watcher;
});
gulp.task('less', ['less:compile', 'less:watch']);


/************
 *** SASS ***
 ************/
gulp.task('sass:compile', function() {
    console.log('sass:compile COMPILING!');
    return gulp.src([
        paths.src + matches.sass,
        '!' + paths.src + excludes.sass,
        '!' + paths.node + excludes.everything,
    ], { base: paths.src })
        .pipe(plumber(function (error) {
            console.log('sass:compile.plumber', error);
        }))
        .pipe(sourcemaps.init())
        .pipe(sass().on('sass:compile.error', function (error) {
            console.log(error);
        }))
        .pipe(sourcemaps.write()) // save .map        
        .pipe(autoprefixer({ browsers: browserlist })) // autoprefixer
        .pipe(gulp.dest(paths.root)) // save .css
        .pipe(cssmin())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest(paths.root)); // save .min.css
});
gulp.task('sass:watch', function() {
    var watcher = gulp.watch(paths.src + matches.sass, ['sass:compile']);
    watcher.on('change', function(e) {
        console.log('watcher.on.change type: ' + e.type + ' path: ' + e.path);
    });
    return watcher;
});
gulp.task('sass', ['sass:compile', 'sass:watch']);


/******************
 *** JS BUNDLES ***
 ******************/
var jsbundles = [];
bundles.js.forEach(function(bundle, i) {
    var key = 'js:bundle:' + i;    
    jsbundles.push(key);
    gulp.task(key, function() {
        var pipes = gulp.src(bundle.src, { base: '.' })
        .pipe(plumber(function(error) {
            console.log(key + '.plumber', error);
        }))
        if (bundle.folder) {
            console.log(key, 'do:folder', bundle.folder, bundle.src);
            pipes = pipes.pipe(rename({
                dirname: '', // flatten directory
            })).pipe(gulp.dest(bundle.folder)); // copy files        
        }
        if (bundle.dist) { // concat bundle
            console.log(key, 'do:concat', bundle.dist, bundle.src);
            pipes = pipes.pipe(rename({
                dirname: '', // flatten directory
            }))
            .pipe(concat(bundle.dist)) // concat bundle
            .pipe(gulp.dest('.')) // save .js
            .pipe(sourcemaps.init())
            .pipe(uglify()) // { preserveComments: 'license' }
            .pipe(rename({ extname: '.min.js' }))
            .pipe(sourcemaps.write('.')) // save .map  
            .pipe(gulp.dest('.')); // save .min.js            
        }
        return pipes;    
    });
});
gulp.task('js:bundles', jsbundles, function(done) { done(); });
gulp.task('js:watch', function() {
    var watcher = gulp.watch([
        paths.src + matches.js,
        '!' + paths.src + excludes.js,
        '!' + paths.node + excludes.everything
    ], { base: paths.src }, ['js:bundles']);
    watcher.on('change', function(e) {
        console.log(e.type + ' watcher did change path ' + e.path);
    });
    return watcher;
});


/*******************
 *** CSS BUNDLES ***
 *******************/
var cssbundles = [];
bundles.css.forEach(function(bundle, i) {
    var key = 'css:bundle:' + i;    
    jsbundles.push(key);
    gulp.task(key, ['less:compile', 'sass:compile'], function() {
        var pipes = gulp.src(bundle.src, { base: '.' })
        .pipe(plumber(function(error) {
            console.log(key + '.plumber', error);
        }))
        if (bundle.folder) {
            console.log(key, 'do:folder', bundle.folder, bundle.src);
            pipes = pipes.pipe(rename({
                dirname: '', // flatten directory
            })).pipe(gulp.dest(bundle.folder)); // copy files        
        }
        if (bundle.dist) {
            console.log(key, 'do:concat', bundle.dist, bundle.src);
            pipes = pipes.pipe(rename({
                dirname: '', // flatten directory
            }))
            .pipe(concat(bundle.dist)) // concat bundle
            .pipe(gulp.dest('.')) // save .css
            .pipe(sourcemaps.init())
            .pipe(cssmin())
            .pipe(rename({ extname: '.min.css' }))
            .pipe(sourcemaps.write('.')) // save .map  
            .pipe(gulp.dest('.')); // save .min.css
        }
        return pipes;
    });
});
gulp.task('css:bundles', cssbundles, function(done) { done(); });
gulp.task('css:watch', function() {
    var watcher = gulp.watch([
        paths.src + matches.css,
        '!' + paths.src + excludes.css,
        '!' + paths.node + matches.everything
    ], { base: paths.src }, ['css:bundles']);
    watcher.on('change', function(e) {
        console.log(e.type + ' watcher did change path ' + e.path);
    });
    return watcher;
});


/***************
 *** COMPILE ***
 ***************/
gulp.task('compile', ['less:compile', 'sass:compile', 'css:bundles', 'js:bundles'], function(done) { done(); });


/*************
 *** SERVE ***
 *************/
gulp.task('serve', ['compile'], function() {
    // more info on https://www.npmjs.com/package/gulp-webserver   
    var options = {
        host: server.name,
        port: server.port,
        directoryListing: true,
        open: true,
        middleware: [
            rewrite([
                '!\\.html|\\.js|\\.css|\\.map|\\.svg|\\.jp(e?)g|\\.png|\\.gif$ /index.html'
            ]),
            function(request, response, next) {
                // console.log('request.url', request.url);
                if (request.url !== '/hello') return next();
                response.end('<h1>Hello, world from ' + options.host + ':' + options.port + '!</h1>');
            },
        ],
        livereload: {
            enable: true, // need this set to true to enable livereload 
            filter: function(filename) {
                return !filename.match(/.map$/); // exclude all source maps from livereload
            }
        },
    };
    return gulp.src(paths.root).pipe(webserver(options));
});


/*************
 *** WATCH ***
 *************/
gulp.task('watch', ['less:watch', 'sass:watch', 'typescript:watch', 'css:watch', 'js:watch', 'jade:watch'], function(done) { done(); });


/*************
 *** START ***
 *************/
gulp.task('start', ['compile', 'watch'], function (done) { done(); }); // ['compile', 'serve', 'watch']











/*
var folders = {
    css: '/css',
    js: '/js',
    vendors: '/vendors',
    typescript: '/js',
    jade: '/',
};
var names = {
    vendors: '/vendors.js',
};
paths.vendors = paths.root + folders.js + folders.vendors;

gulp.task('vendors:clean', function() {
    return del([paths.vendors + matches.everything]);
});

var angularjs = {
    src: [ // important!! keep loading order for bundle
        paths.bower + '/angular/angular.js',
        paths.bower + '/angular-route/angular-route.js',
        paths.bower + '/angular-animate/angular-animate.js',
    ]
}
gulp.task('vendors:angularjs', ['vendors:clean'], function() {
    return gulp.src(angularjs.src, { base: '.' })
        .pipe(plumber(function(error) {
            console.log('angularjs:compile.plumber', error);
        }))
        .pipe(rename({
            dirname: '', // flatten directory
        }))
        .pipe(gulp.dest(paths.vendors)) // save files
        .pipe(concat(paths.vendors + names.vendors))
        .pipe(gulp.dest('.')) // save .js
        .pipe(sourcemaps.init())
        .pipe(uglify()) // { preserveComments: 'license' }
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest('.')) // save .min.js
        .pipe(sourcemaps.write('.')); // save .map       
});

gulp.task('angularjs', ['vendors:clean', 'vendors:angularjs'], function(done) { done(); });

var angular2 = {
    src: [ // important!! keep loading order for bundle
        paths.node + '/es6-shim/es6-shim.js',
        paths.node + '/angular2/es6/dev/src/testing/shims_for_IE.js',
        paths.node + '/systemjs/dist/system-polyfills.js',
        paths.node + '/angular2/bundles/angular2-polyfills.js',
        paths.node + '/systemjs/dist/system.js',
        paths.node + '/rxjs/bundles/Rx.js',
        paths.node + '/angular2/bundles/angular2.dev.js',
        paths.node + '/angular2/bundles/http.dev.js',
        paths.node + '/angular2/bundles/router.dev.js',        
    ]
}
gulp.task('vendors:angular2', ['vendors:clean'], function() {
    return gulp.src(angular2.src, { base: '.' })
        .pipe(plumber(function(error) {
            console.log('angular2:compile.plumber', error);
        }))
        .pipe(rename({
            dirname: '', // flatten directory
        }))        
        .pipe(gulp.dest(paths.vendors)) // save files
        .pipe(concat(paths.vendors + names.vendors))
        .pipe(gulp.dest('.')) // save .js
        .pipe(sourcemaps.init())
        .pipe(uglify()) // { preserveComments: 'license' }
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest('.')) // save .min.js
        .pipe(sourcemaps.write('.')); // save .map        
});
gulp.task('angular2', ['vendors:clean', 'vendors:angular2'], function(done) { done(); });

gulp.task('serve', ['typescript:compile', 'less:compile', 'sass:compile', 'jade:compile'], function() {
    // more info on https://www.npmjs.com/package/gulp-webserver   
    var options = {
        host: SERVER_NAME,
        port: SERVER_PORT,
        directoryListing: true,
        open: true,
        middleware: [
            rewrite([
                '!\\.html|\\.js|\\.css|\\.map|\\.svg|\\.jp(e?)g|\\.png|\\.gif$ /index.html'
            ]),
            function(request, response, next) {
                // console.log('request.url', request.url);
                if (request.url !== '/hello') return next();
                response.end('<h1>Hello, world from ' + options.host + ':' + options.port + '!</h1>');
            },
        ],
        livereload: {
            enable: true, // need this set to true to enable livereload 
            filter: function(filename) {
                return !filename.match(/.map$/); // exclude all source maps from livereload
            }
        },
    };
    return gulp.src(paths.root)
        .pipe(webserver(options));
});
// angular2 startup task
gulp.task('start', [
    'vendors:clean', 'vendors:angular2', 
    'typescript:compile', 'less:compile', 'sass:compile', 'jade:compile', 
    'serve', 
    'typescript:watch', 'less:watch', 'sass:watch', 'jade:watch'
]);
// angularjs startup task 
gulp.task('start', [
    'vendors:clean', 'vendors:angularjs', 
    'typescript:compile', 'less:compile', 'sass:compile', 'jade:compile', 
    'serve', 
    'typescript:watch', 'less:watch', 'sass:watch', 'jade:watch'
]);
*/