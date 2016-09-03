var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var ts = require('gulp-typescript');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var shell = require('gulp-shell');
var dust = require('gulp-dust');

var tsProject = ts.createProject({
    module: "commonjs",
    target: "es5",
    preserveConstEnums: true,
    sourceMap: true
});

gulp.task('typescript', [/*'prettify'*/], function () {
    var result = gulp.src('src/**/*.ts')
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));

    return result.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/'));
});

// Start up the application
gulp.task('start', ['build'], function () {
    nodemon({
        script: 'app/app.js',
        watch: [
            'app/**'
        ]
    });
});

gulp.task('watch', function () {
    gulp.watch('src/**/*.ts', ['typescript']);
});

gulp.task('watch-dust', function () {
    gulp.watch('src/templates/**/*.html', ['dust']);
});

gulp.task('dust', () => {
    return gulp.src('src/templates/**/*.html')
        .pipe(dust())
        .pipe(concat('dusts.js'))
        .pipe(gulp.dest('public/js'));
});

// gulp.task('prettify', shell.task(['./tsformat.sh']));
gulp.task('build', [/*'prettify',*/ 'dust', 'typescript']);
gulp.task('default', ['build', 'start', 'watch', 'watch-dust']);
