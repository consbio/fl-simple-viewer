var gulp = require("gulp");
var minify = require("gulp-minify");
var strip = require("gulp-strip-comments");
var cleanCSS = require("gulp-clean-css");
var concat = require("gulp-concat");
var less = require("gulp-less");
var util = require("gulp-util");
var expect = require("gulp-expect-file");
var rename = require("gulp-rename");

// in development (no minify) mode, call this as
// > gulp build --debug
var config = {
    debug: !!util.env.debug,
};

gulp.task("less", function () {
    return gulp
        .src(["static/src/common.less", "static/src/pdf.less"])
        .pipe(less())
        .pipe(gulp.dest("build"));
});

gulp.task(
    "compress-css",
    gulp.series(["less"], function () {
        return gulp
            .src([
                "node_modules/leaflet/dist/leaflet.css",
                "node_modules/leaflet-geonames/L.Control.Geonames.css",
                "node_modules/leaflet-zoombox/L.Control.ZoomBox.css",
                "node_modules/leaflet-basemaps/L.Control.Basemaps.css",
                "node_modules/dc/dc.min.css",
                "node_modules/nvd3/build/nv.d3.min.css",
                "build/common.css",
                "static/src/main.css",
            ])
            .pipe(cleanCSS())
            .pipe(concat("all.min.css"))
            .pipe(gulp.dest("static/dist"));
    })
);

// compress our JS files
gulp.task("compress-js", function () {
    return gulp
        .src([
            "static/src/config.js",
            "static/src/utils.js",
            "static/src/main.js",
            "static/src/reporter.js",
        ])
        .pipe(concat("core.js"))
        .pipe(!config.debug ? minify() : rename("core-min.js")) // only minify if not debug
        .pipe(gulp.dest("build"));
});

// concatenate all dependences
gulp.task("concat-js", function () {
    return gulp
        .src([
            "node_modules/leaflet/dist/leaflet.js",
            "node_modules/leaflet-omnivore/leaflet-omnivore.min.js",
            "node_modules/leaflet-geonames/L.Control.Geonames.min.js",
            "node_modules/leaflet-zoombox/L.Control.ZoomBox.min.js",
            "node_modules/leaflet-basemaps/L.Control.Basemaps-min.js",
            "node_modules/lodash/lodash.min.js",
            "node_modules/crossfilter/crossfilter.min.js",
            "node_modules/d3/d3.min.js",
            "node_modules/dc/dc.min.js",
            "node_modules/nvd3/build/nv.d3.min.js",
            "node_modules/handlebars/dist/handlebars.min.js",
        ])
        .pipe(strip())
        .pipe(concat("deps.min.js"))
        .pipe(gulp.dest("build"));
});

// merge our files with the dependencies
gulp.task(
    "merge-js",
    gulp.series(["concat-js", "compress-js"], function () {
        var files = ["build/deps.min.js", "build/core-min.js"];
        return gulp
            .src(files)
            .pipe(expect({ reportMissing: true }, files))
            .pipe(concat("all.min.js"))
            .pipe(gulp.dest("static/dist"));
    })
);

gulp.task(
    "compress-pdf-css",
    gulp.series(["less"], function () {
        return gulp
            .src([
                "node_modules/leaflet/dist/leaflet.css",
                "build/common.css",
                "build/pdf.css",
            ])
            .pipe(cleanCSS())
            .pipe(concat("all-pdf.min.css"))
            .pipe(gulp.dest("static/dist"));
    })
);

gulp.task("compress-pdf-js", function () {
    return gulp
        .src(["static/src/pdf.js"])
        .pipe(concat("pdf.js"))
        .pipe(minify())
        .pipe(gulp.dest("build"));
});

gulp.task(
    "concat-pdf-js",
    gulp.series(["compress-pdf-js"], function () {
        return gulp
            .src([
                "node_modules/leaflet/dist/leaflet.js",
                "node_modules/leaflet-image/leaflet-image.js",
                "node_modules/jspdf/dist/jspdf.debug.js",
                "build/pdf-min.js",
            ])
            .pipe(strip())
            .pipe(concat("all-pdf.min.js"))

            .pipe(gulp.dest("static/dist"));
    })
);

gulp.task("copy-files", function () {
    return gulp
        .src(["node_modules/leaflet/dist/images/*"])
        .pipe(gulp.dest("static/dist/images"));
});

gulp.task(
    "build",
    gulp.series([
        "merge-js",
        "compress-css",
        "concat-pdf-js",
        "compress-pdf-css",
        "copy-files",
    ])
);

gulp.task("watch", function () {
    gulp.watch(
        "static/src/*.less",
        gulp.parallel(["compress-css", "compress-pdf-css"])
    );
    gulp.watch(
        "static/src/*.css",
        gulp.parallel(["compress-css", "compress-pdf-css"])
    );
    gulp.watch("static/src/*.js", gulp.parallel(["merge-js", "concat-pdf-js"]));
});

gulp.task("default", gulp.series(["build", "watch"]));
