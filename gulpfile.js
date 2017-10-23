'use strict';

var gulp = require('gulp');

gulp.task('build', [], function () {
  gulp.start('tachyon');
});

gulp.task('default', ['build'], function () {

});

