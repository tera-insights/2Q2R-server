var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var ts = require('gulp-typescript');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var shell = require('gulp-shell');

var tsProject = ts.createProject({
    module: "commonjs",
    target: "es5",
    preserveConstEnums: true,
    sourceMap: true
});

gulp.task('typescript server', ['prettify'], function() {
    var result = gulp.src('src/app/**/*.ts')
            .pipe(sourcemaps.init())
            .pipe(ts(tsProject));

    gulp.src('src/config.js')
        .pipe(gulp.dest('.'));

    return result.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/'));
});

gulp.task('typescript client', ['typescript server'], function() {
    var result = gulp.src('src/public/**/*.ts')
            .pipe(sourcemaps.init())
            .pipe(ts(tsProject));
    
    return result.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('public/'));
});

gulp.task('copy assets',  function() {
    // Also, copy over other assets
    var result = gulp.src([
        'src/public/**/*.css',
        'src/public/**/*.js',
        'src/public/**/*.html',
        'src/public/**/*.png',
        'src/public/**/*.jpg'
    ]);

    return result.pipe(gulp.dest('public/'));
});

gulp.task('copy config', ['typescript client'], function() {
    var result = gulp.src('src/config.js')
            .pipe(gulp.dest('.'));
    
    return result;
});

/*

 gulp.task('build tests', ['typescript client'], function() {
    var result = gulp.src('public/modules/core/SocketWrappers.js')
            .pipe(gulp.dest('test/'));

    return result;
});
*/
// Start up the application
gulp.task('start' ,['build'], function() {
    nodemon({
        script: 'app/app.js',
        watch: [
            'app/**'
        ]
    });
});

gulp.task('watch', function() {
    gulp.watch('src/app/**/*.ts', ['typescript server']);
    gulp.watch('src/public/**/*.ts', ['typescript client']);
    gulp.watch(['src/public/**/*.*', '!src/public/**/*.ts'], ['copy assets']);
});

gulp.task('prettify', shell.task(['./tsformat.sh'])); 
gulp.task('build', ['prettify', 'typescript server', 'typescript client', 'copy assets']);
gulp.task('default', ['build', 'start', 'watch']);
