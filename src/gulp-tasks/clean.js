var gutil = require('gulp-util');
var clean = require('gulp-clean');

function configureTasks(gulp, gulpsync, project){
  gulp.task('clean', ['clean:tmp', 'clean:dist']);

  gulp.task('clean:dist', function (){
    return gulp.src('dist', {
      read: false
    }).pipe(clean());
  });

  gulp.task('clean:tmp', function (){
    return gulp.src('.tmp', {
      read: false
    }).pipe(clean());
  });
}

module.exports = configureTasks;
