var fs = require('fs');
var path = require('path');
var ngConstant = require('gulp-ng-constant');
var merge = require('gulp-merge');
var rename = require('gulp-rename');
var extend = require('extend');
var webpack = require('webpack');
var stream = require('webpack-stream');
var gutil = require('gulp-util');
var chalk = require('chalk');

var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var BellOnBundlerErrorPlugin = require('bell-on-bundler-error-plugin');

var lastUsedEnv = 'stage';


var modulesPath = path.resolve(
  __dirname,
  path.dirname(require.resolve('babel')),
  '..'
);

var generateConfigStream = function (configFile, options){
  var baseJson, config, envConstants, json, mergedStreams, settings;
  if (options == null){
    options = {};
  }
  settings = extend(true, extend(true, {}, options), {
    outputFileName: "config-[env].js"
  });
  config = JSON.parse(fs.readFileSync(configFile));
  mergedStreams = merge();

  var envs = config.enviroments;
  for (var env in envs){
    envConstants = envs[env];
    baseJson = extend(true, {}, config);
    json = extend(true, baseJson, {
      constants: envConstants
    });
    json.stream = true;
    mergedStreams.add(ngConstant(json)
      .pipe(rename(settings.outputFileName.replace('[env]', env))));
  }
  return merge(mergedStreams);
};

function configureTasks(gulp, gulpsync, project){
  var src = project.build.srcPath;

  project.webPackConfigs = project.webPackConfigs || [];

  gulp.task('generate-config', function (){
    return generateConfigStream(project.build.runtimeConfig || src + '/config.json')
      .pipe(gulp.dest(project.dir + `${project.isProd ? '/dist/' : '/.tmp/'}` + 'scripts/config/'));
  });

  var setEnv = false;
  gulp.task('set-env', function (){
    var env;
    env = project.env || lastUsedEnv || 'stage';
    project.env = lastUsedEnv = env;

    if (setEnv){
      gutil.log(gutil.colors.green('WebPack for set-env already runned'));
      return;
    }
    gutil.log(gutil.colors.red('ENV = ' + lastUsedEnv));

    setEnv = true;

    project.envWebPackConfig = {
      devtool: false,
      resolveLoader: {
        modules: [
          modulesPath,
        ],
        extensions: ['.js', '.jsx', '.coffee']

      },
      resolve: {
        modules: [
          path.resolve(__dirname, '../../node_modules/'),
          path.resolve(__dirname, 'node_modules/'),
          path.resolve(project.dir, 'node_modules/'),
        ],
        extensions: ['.js'],

      },
      plugins: [
        // new webpack.ProvidePlugin({
        //   "window.jQuery": "jquery"
        // }),
        new ProgressBarPlugin({
          format: '  build config.js [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
          clear: false
        }),
        new BellOnBundlerErrorPlugin(),
        // new webpack.NoErrorsPlugin(),
        new webpack.NamedModulesPlugin(),
      ],
      externals: {
        angular: "angular"
      },
      context: path.resolve(src) + '/',
      entry: {
        'config': [
          project.dir + `${project.isProd ? '/dist/' : '/.tmp/'}scripts/config/config-` + env
        ]
      }
      ,
      module: {
        loaders: [{
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: [/bower_components/, /node_modules/i],
          options: {
            cacheDirectory: true
          },
        }]
      },
      output: {
        filename: 'scripts/[name].js',
        path: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}`,
        pathinfo: true,
        publicPath: '/' //cdn :-??
        // publicPath : 'http://localhost:9000/',
      },

    }

    project.webPackConfigs.push(project.envWebPackConfig);

  });

  gulp.task('config-env', gulpsync.sync(['generate-config', 'set-env']));


}

module.exports = configureTasks;
