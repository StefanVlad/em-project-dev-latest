var fs = require('fs');
var path = require('path');
var extend = require('extend');
var gutil = require('gulp-util');
var argv = require('yargs').argv;

/**
 * Project feature detector, will detect bower, cex, etc and expose their configuration
 * @param projectDir
 * @constructor
 */
function Project(projectDir) {
    var $ENV = process.env.ENV || argv.env;

    var loadJson = function(path) {
        try {
            return JSON.parse(fs.readFileSync(path));
        } catch (e) {
            gutil.log(gutil.colors.red('[!] bad json file ' + path));
            return null;
        }
    };


    var bower = function() {
        var info = {};

        var jsonFile = path.resolve(projectDir, 'bower.json');
        if (!fs.existsSync(jsonFile)) {
            info.hasFeature = false;
            return;
        }

        gutil.log(gutil.colors.blue('FEATURE: bower detected'));

        info.hasFeature = true;
        info.directory = 'bower_components';

        //find bower_components folder path
        var rcFile = path.resolve(projectDir, '.bowerrc');
        if (fs.existsSync(rcFile)) {
            var json = loadJson(rcFile);
            if (json) {
                extend(true, info, loadJson(rcFile));
            }
        }
        return info;
    };

    var cex = function() {
        var info = {};

        var jsonFile = path.resolve(projectDir, 'cex.json');
        if (!fs.existsSync(jsonFile)) {
            info.hasFeature = false;
            return;
        }

        info.hasFeature = true;
        info.directory = 'cex_components';

        gutil.log(gutil.colors.blue('FEATURE: cex detected'));

        //find cex_components folder path
        var rcFile = path.resolve(projectDir, '.cexrc');
        if (fs.existsSync(rcFile)) {
            var json = loadJson(rcFile);
            if (json) {
                extend(true, info, json);
            }
        }
        return info;
    };

    var build = function() {
        var cfg, info = {};

        //project build.json file will extend the default one
        var defaultBuildConfig = require('../build.json');
        var projectBuildFile;

        if (fs.existsSync(projectBuildFile = path.join(projectDir, 'build.json'))) {

            var projectBuildConfig = require(projectBuildFile);
            cfg = extend(true, {}, defaultBuildConfig, projectBuildConfig);
        } else {
            cfg = defaultBuildConfig;
        }

        if ($ENV && cfg.enviroments && cfg.enviroments[$ENV]) {
            info = extend(true, {}, cfg.default, cfg.enviroments[$ENV]);
        } else {
            if ($ENV) {
                gutil.log(gutil.colors.blue('[!] ' + $ENV + " enviroment not found in config file, using defaults"));
            }

            info = cfg.default;
        }

        info.hasCms = !info.disableCms && info.hasOwnProperty('cms');

        if (info.hasCms) {
            gutil.log(gutil.colors.blue('FEATURE: CMS detected'));
        }

        return info;
    };

    this.dir = projectDir;
    this.env = $ENV;
    this.bower = bower();
    this.cex = cex();
    this.build = build();
}


module.exports = Project;
