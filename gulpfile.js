var gulp = require('gulp');
var minify = require('gulp-minify');
var strip = require('gulp-strip-comments');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');


gulp.task('compress-css', function () {
    gulp.src([
            'deps/fontawesome/css/font-awesome.min.css',
            'deps/leaflet.css',
            'deps/L.Control.Geonames.css',
            'deps/L.Control.ZoomBox.css',
            'node_modules/leaflet-basemaps/L.Control.Basemaps.css',
            'deps/dc.css',
            'deps/nv.d3.css',
            'static/src/main.css'
        ])
        .pipe(cleanCSS())
        .pipe(concat('all.min.css'))
        .pipe(gulp.dest('static/dist'))
});


gulp.task('compress-js', function () {
    gulp.src([
        'static/src/config.js',
        'static/src/utils.js',
        'static/src/main.js'
    ])
        .pipe(concat('core.js'))
        .pipe(minify())
        .pipe(gulp.dest('build'))
});


gulp.task('concat-js', ['compress-js'], function () {
    gulp.src([
        'deps/leaflet.js',
        'deps/leaflet-omnivore.min.js',
        'deps/L.Control.Geonames.min.js',
        'deps/L.Control.ZoomBox.min.js',
        'node_modules/leaflet-basemaps/L.Control.Basemaps-min.js',
        'deps/d3.min.js',
        'deps/lodash.min.js',
        'deps/crossfilter.min.js',
        'deps/dc.min.js',
        'deps/nv.d3.min.js',
        'build/core-min.js'
    ])
        .pipe(strip())
        .pipe(concat('all.min.js'))

        .pipe(gulp.dest('static/dist'))
});


gulp.task('build', ['concat-js', 'compress-css'], function () {});



gulp.task('watch', function () {
    gulp.watch('static/src/*.css', ['compress-css']);
    gulp.watch('static/src/*.js', ['concat-js']);
});


gulp.task('default', ['compress-css', 'concat-js', 'watch']);


