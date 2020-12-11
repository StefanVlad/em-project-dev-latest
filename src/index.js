'use strict';

var path = require('path');
var globule = require('globule');
var gsync = require('gulp-sync');

require('events').EventEmitter.defaultMaxListeners = 0;

function configureTasks(config) {
    var gulp = config.localGulp;
    var gulpsync = gsync(gulp);

    var Project = require('./project');
    var project = new Project(config.projectDir);

    //this is a do-nothing task replacement for optional tasks
    gulp.task('null', []);

    var tasksPath = path.resolve(__dirname, 'gulp-tasks/*.js');
    globule.find(tasksPath).forEach(function (task) {
        require(task)(gulp, gulpsync, project);
    });
}

module.exports = configureTasks;
