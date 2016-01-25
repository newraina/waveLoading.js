var gulp   = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('script', function () {
    gulp.src('waveLoading.js')
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(''))
});

gulp.task('default', ['script']);
