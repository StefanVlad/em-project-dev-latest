var fs = require('fs');
var path = require('path');
var http = require('http');

function configureTasks(gulp, gulpsync, project){
  var src = project.build.srcPath;

  gulp.task('serve:dist', gulpsync.sync(['build', 'start-dist-server']));

  gulp.task('serve:dist-no-min', gulpsync.sync(['build-no-minify', 'start-dist-server']));

  gulp.task('serve', ['webpack-dev-server'], function (){

    if (project.bower.hasFeature){
      gulp.watch(src + '/index.html', ['wiredep-hot-styles']);
      gulp.watch('bower.json', ['wiredep-hot-styles']);
    }

    gulp.watch(src + '/config.json', ['config-env']);

  });
}

module.exports = configureTasks;
