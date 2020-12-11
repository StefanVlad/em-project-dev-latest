var fse = require('fs-extra');
var webpack = require('webpack');
var path = require('path');
var chalk = require('chalk');
var size = require('gulp-size');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var usemin = require('gulp-usemin');
var rev = require('gulp-rev');
var autoprefixer = require('gulp-autoprefixer');
var plumber = require('gulp-plumber');

var WebpackDevServer = require("webpack-dev-server");
var WriteFilePlugin = require('write-file-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var WebpackBrowserPlugin = require('webpack-browser-plugin');
var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var BellOnBundlerErrorPlugin = require('bell-on-bundler-error-plugin');

var LiveReloadPlugin = require('webpack-livereload-plugin');

var stream = require('webpack-stream');

var NGAnnotatePlugin = require('ng-annotate-webpack-plugin');
var gutil = require('gulp-util');
var wiredep = require('wiredep').stream;
const wireFiles = require('wiredep');
const mainBowerFiles = require('main-bower-files');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var injectString = require('gulp-inject-string');

const UglifyJS = require('uglify-js');
const CleanCSS = require('clean-css');

var minifyHTML = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');

const q = require('bluebird');

var cexUtils = require('gulp-cex-utils');
var cexGenerateStyles = cexUtils.cexGenerateStyles;
var cexBrowserify = cexUtils.cexBrowserify;
var cexComponentsJson = {};

var modulesPath = path.resolve(
  __dirname,
  path.dirname(require.resolve('babel')),
  '..'
);


cexBrowserify({
  require: function (component, result){
    return cexComponentsJson[result.expose] = component;
  }
});


function configureTasks(gulp, gulpsync, project){
  var src = project.build.srcPath;
  cexGenerateStyles();

  gulp.task('configure-webpack', function (){


    let mainFiles = mainBowerFiles();
    let copyBowerAssetsConfig = [];


    for (let file of mainFiles){
      copyBowerAssetsConfig.push({
        from: file,
        to: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}` + file.substring(file.indexOf('bower_components'))
      });
    }


    project.webPackConfigs = project.webPackConfigs || [];

    project.scriptsWebPackConfig = {
      // devtool:false,
      devtool: '@cheap-source-map',//good performance
      // devtool: '#module-inline-source-map',//bad performance
      // devtool : '#inline-source-map', // bad performance, good sourceMap

      resolveLoader: {
        modules: [
          modulesPath
        ],
        extensions: ['.js', '.jsx', '.coffee']
      },
      module: {
        loaders: [
          {
            test: /\.coffee$/,
            loader: "coffee-loader",
            include: [
              path.resolve(project.dir, src),
            ],
            options: {
              cacheDirectory: true
            }
          },
          {
            test: /\.js$/,
            loader: 'babel-loader',
            include: [
              path.resolve(project.dir, src),
            ],
            options: {
              cacheDirectory: true
            }
          },
          {
            test: /\.html$/,
            loader: "ngtemplate-loader?relativeTo=" + (path.resolve(project.dir, src)) + "/!html-loader",
            include: [
              path.resolve(project.dir, src),
            ],

          }
        ],
        // noParse : [/img/, /icons/, /fonts/, /styles/],
      },
      context: path.resolve(src) + '/',
      entry: {
        'app_bundle': [
          './scripts/app'
        ]
      },
      output: {
        filename: 'scripts/[name].js',
        path: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}`,
        pathinfo: true,
        publicPath: '/' //cdn :-??
        // publicPath : 'http://localhost:9000/',
      },
      resolve: {
        modules: [
          path.resolve(__dirname, '../../node_modules/'),
          path.resolve(__dirname, 'node_modules/'),
          path.resolve(project.dir, 'node_modules/'),
          path.resolve(src, 'scripts'),
        ],
        extensions: ['.js', '.coffee', '.html'],
        alias: cexComponentsJson,
      },
      externals: {
        'angular': 'angular',
        'socket.io-stream': 'socket.io-stream'
      },
      plugins: [
        // new webpack.ProvidePlugin({
        //   "window.jQuery": "jquery"
        // }),
        new NGAnnotatePlugin({
          add: true
        }),
        new CopyWebpackPlugin(copyBowerAssetsConfig, {
          debug: 'warning',
          ignore: [
            '*.coffee',
            '*.txt',
            '*.json',
            '*.scss',
            '*.less',
            '*.md',
            '*.gzip',
            '.*',

            // doesn't copy dot files
            // { glob : '**/*', dot : true }
          ]
        }),
        new CopyWebpackPlugin([
            {
              context: path.resolve(src) + '/cex_components',
              from: '**/*.html',
              to: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}cex_components`
            },
            {
              context: path.resolve(src) + '/styles/themes',
              from: '**/*.css',
              to: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}styles/themes`
            },
            {
              context: path.resolve(src) + '/scripts',
              from: '**/*.html',
              to: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}scripts/`
            },
            {
              context: path.resolve(src) + '/views',
              from: '**/*.html',
              to: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}views/`
            },
            {
              context: path.resolve(src) + '/bower_components/angular-ui-grid/fonts',
              from: '**/*.*',
              to: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}styles/fonts`
            }
          ],
          {
            debug: 'warning',
            ignore: [
              '*.coffee',
              '*.txt',
              '*.json',
              '*.html.20*.html',//older templates
              '*.scss',
              '*.less',
              '*.md',
              '*.gzip',
              '.*',
              // doesn't copy dot files
              // { glob : '**/*', dot : true }
            ]
          }),
        new CopyWebpackPlugin([
          {
            from: path.resolve(src) + '/img',
            to: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}img`
          },
          {
            from: path.resolve(src) + '/icons',
            to: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}icons`
          },
          {
            from: path.resolve(src) + '/fonts',
            to: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}fonts`
          }
        ], {
          debug: 'warning',
          ignore: [
            '*.coffee',
            '*.json',
            '*.txt',
            '*.scss',
            '*.less',
            '*.md',
            '*.gzip',
            '.*',

            // doesn't copy dot files
            // { glob : '**/*', dot : true }
          ]
        }),
        // new WriteFilePlugin( {
        //     force : true,
        //     test : /.*/
        // } ),
        new ProgressBarPlugin({
          format: '  build app_bundle.js [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
          clear: false
        }),

        new BellOnBundlerErrorPlugin(),
        new webpack.NamedModulesPlugin(),
      ]
    };

    project.webPackConfigs.push(project.scriptsWebPackConfig);

    gutil.log(gutil.colors.red('DIR = ', modulesPath));
    project.webPackConfigs = project.webPackConfigs || [];

    project.stylesWebPackConfig = {
      devtool: false,
      resolveLoader: {
        modules: [
          modulesPath,
          path.resolve(__dirname, '../../node_modules')
        ],
        extensions: ['.js', '.jsx', '.coffee']

      },
      module: {
        loaders: [
          {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract({
              fallback: "style-loader",
              use: 'css-raw-loader'
            })
          },
          {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract({
              fallback: "style-loader",
              use: 'css-raw-loader!sass-loader'
            })
          },
        ]
      },
      context: path.resolve(src) + '/',
      entry: {
        'angular-material': './styles/angular-material',
        'dataTables.jqueryui': './styles/dataTables.jqueryui',
        'normalize': './styles/normalize',
        'main': './styles/main'
      },
      output: {
        filename: 'styles/[name].js',
        path: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}`,
        pathinfo: true,
        publicPath: '/' //cdn :-?
      },
      resolve: {
        modules: [
          path.resolve(__dirname, '../../node_modules/'),
          path.resolve(__dirname, 'node_modules/'),
          path.resolve(project.dir, 'node_modules/'),
          path.resolve(src + '/styles/'),

        ],
        extensions: ['.scss', '.css'],
      },
      plugins: [
        // new WriteFilePlugin( {
        //    force : true,
        //    test : /.*/
        //} ),
        new ExtractTextPlugin({
          filename: 'styles/[name].css',
          disable: false,
          allChunks: true
        }),
        new ProgressBarPlugin({
          format: '  build entry styles [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
          clear: false
        }),
        new BellOnBundlerErrorPlugin(),
        new webpack.NamedModulesPlugin(),
      ]
    };

    project.webPackConfigs.push(project.stylesWebPackConfig);

  });
  gulp.task('start-dev-server', function (){
    gutil.log(gutil.colors.blue('WebPack Dev Server Starting Up'));

    var finalConfs = [];

    project.scriptsWebPackConfig.plugins.push(
      new WebpackBrowserPlugin({
        // browser : 'Chrome',
        port: 9000,
        url: 'http://localhost',
      }));

    project.scriptsWebPackConfig.plugins.unshift(new LiveReloadPlugin({
      appendScriptTag: true,
      ignore: /\.js/
    }));

    project.stylesWebPackConfig.plugins.unshift(new LiveReloadPlugin({
      appendScriptTag: true,
      ignore: /\.js/
    }));

    project.scriptsWebPackConfig.entry.app_bundle.unshift(
      'webpack-dev-server/client?/',
      'webpack/hot/dev-server',
      require.resolve('wds-banner/index') + '?/'
    );

    project.envWebPackConfig.entry.config.unshift(
      'webpack-dev-server/client?/',
      'webpack/hot/dev-server',
      require.resolve('wds-banner/index') + '?/'
    );

    for (var i in project.webPackConfigs){

      var webPackConfig = Object.create(project.webPackConfigs[i]);
      webPackConfig.cache = true;
      webPackConfig.watch = true;
      // webPackConfig.watchOptions = {
      //     aggregateTimeout : 1500, // time to delay build
      //     poll : 1000 // polling
      // };
      webPackConfig.plugins.push(new webpack.HotModuleReplacementPlugin({
        quiet: false
      }));
      finalConfs.push(webPackConfig);
    }

    gutil.log(gutil.colors.blue('WebPack Configs : ' + finalConfs.length));

    new WebpackDevServer(webpack(finalConfs), {
      publicPath: '/',
      hot: true, // we must have plugin hotModule replacement, and this will not trigger reload, instead a hot update.
      quiet: false,
      noInfo: false,
      compress: true,
      // overlay : true,
      // Set this if you want webpack-dev-server to delegate a single path to an arbitrary server.
      // Use "*" to proxy all paths to the specified server.
      // This is useful if you want to get rid of 'http://localhost:8080/' in script[src],
      // and has many other use cases (see https://github.com/webpack/webpack-dev-server/pull/127 ).
      /*proxy: {
       "*": "http://localhost:9091"
       },*/
      contentBase: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}`,
      historyApiFallback: {
        rewrites: [
          // shows views/landing.html as the landing page
          {from: /^\/$/, to: '/index.html'},
          // { from : /^((?!(html|css|js|png|jpg|jpeg|)).)*$/, to : '/index.html' },
        ]
      },
      stats: 'normal'
    }).listen(9000, '0.0.0.0', function (err){
      if (err) throw new gutil.PluginError("webpack-dev-server", err);
      // gutil.log( "[webpack-dev-server]", "http://" + myip.getLocalIP4() + ":9000/webpack-dev-server/index.html" );
      gutil.log("[webpack-dev-server]", "http://localhost:9000/");
    });

  });


  gulp.task('set-local', function (){

    project.isProd = false;
    gutil.log(gutil.colors.blue('WebPack Build Live For local Development'));

  });

  gulp.task('webpack-dev-server', gulpsync.sync([
    'clean:tmp',
    'set-local',
    'configure-webpack',
    'config-env',
    'wiredep-hot-styles',
    'start-dev-server'
  ]));


  gulp.task('build-webpack', function (cb){
    gutil.log(gutil.colors.blue('Build WebPack Configs'));

    var finalConfs = [];

    for (var i in project.webPackConfigs){
      var webPackConfig = Object.create(project.webPackConfigs[i]);
      finalConfs.push(webPackConfig);
    }

    gutil.log(gutil.colors.blue('WebPack Configs : ' + finalConfs.length));

    webpack(finalConfs, (error, stats) =>{
      if (error){
        logger.error('WebPack Compiler ERROR');
        console.error(error);
        cb(error);
      }
      console.log(stats.toString({
        assets: false,
        colors: true,
        children: false,
        chunks: false,
        modules: false
      }));
      cb();
    });
  });

  gulp.task('set-minify', function (){
    project.minifyAssets = true;
    gutil.log(gutil.colors.blue('Build Will minify files'));
  });

  gulp.task('set-prod', function (){

    project.isProd = true;
    gutil.log(gutil.colors.blue('WebPack Build Dist For Production'));
  });

  gulp.task('build', gulpsync.sync([
    'clean',
    'set-minify',
    'set-prod',
    'configure-webpack',
    'config-env',
    'build-webpack',
    'copy-files',
    'wiredep-prod',
  ]));

  gulp.task('build-no-minify', gulpsync.sync([
    'clean',
    'set-prod',
    'configure-webpack',
    'config-env',
    'build-webpack',
    'copy-files',
    'wiredep-prod',
  ]));

  gulp.task('start-dist-server', function (){
    gutil.log(gutil.colors.blue('WebPack Dev Server Starting Up - DIST BUILD'));

    new WebpackDevServer(webpack({
        watch: false,
        entry: path.resolve(project.dir) + '/dist/index.html',
        context: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}`,
        module: {
          noParse: /.*/,
        },
        plugins: [new WebpackBrowserPlugin({
          // browser : 'Chrome',
          port: 9000,
          url: 'http://localhost',
        })
        ]
      }),
      {
        publicPath: '/',
        hot: false, // we must have plugin hotModule replacement, and this will not trigger reload, instead a hot update.
        quiet: true,
        noInfo: false,
        compress: true,
        // overlay : true,
        // Set this if you want webpack-dev-server to delegate a single path to an arbitrary server.
        // Use "*" to proxy all paths to the specified server.
        // This is useful if you want to get rid of 'http://localhost:8080/' in script[src],
        // and has many other use cases (see https://github.com/webpack/webpack-dev-server/pull/127 ).
        /*proxy: {
         "*": "http://localhost:9091"
         },*/
        contentBase: path.resolve(project.dir) + `${project.isProd ? '/dist/' : '/.tmp/'}`,
        historyApiFallback: {
          rewrites: [
            // shows views/landing.html as the landing page
            {from: /^\/$/, to: '/index.html'},
            // { from : /^((?!(html|css|js|png|jpg|jpeg|)).)*$/, to : '/index.html' },
          ]
        }
        ,
        stats: 'normal'
      }
    ).listen(9000, '0.0.0.0', function (err){
      if (err) throw new gutil.PluginError("webpack-dev-server", err);
      // gutil.log( "[webpack-dev-server]", "http://" + myip.getLocalIP4() + ":9000/webpack-dev-server/index.html" );
      gutil.log("[webpack-dev-server]", "http://localhost:9000/");
    });

  });


  gulp.task('copy-files', function (){
    fse.copySync('dist/styles', '.tmp/styles');
    fse.copySync('dist/scripts', '.tmp/scripts');
  });

  gulp.task('wiredep-prod', ['wiredep-tmp'], function (){
    function getMinifier(type){
      switch (type){
        case 'css':
          return project.minifyAssets === true ?
            [minifyCss(), rev()] :
            [rev()];
        case 'js':
          //project.env == 'prod' ||
          return project.minifyAssets === true ?
            [uglify(), rev(), size()] :
            [rev(), size()];
      }
    }

    var useminPipes = {
      html: [minifyHTML({empty: true}), size()],
      assetsDir: src
    };

    var fileContents = fse.readFileSync('.tmp/index.html', 'utf8');
    var index = 0;
    var matches = fileContents.match(/build:([^\(\s]+)/g);
    matches.forEach(function (m){
      var pipeId = 'pipe' + index;
      var originalPipeId = m.split(':')[1];
      useminPipes[pipeId] = getMinifier(originalPipeId);
      fileContents = fileContents.replace(m, 'build:' + pipeId);
      index++;
    });

    fse.writeFileSync('.tmp/index.html', fileContents, 'utf8');

    return gulp.src('.tmp/index.html')
      .pipe(plumber())
      .pipe(usemin(useminPipes))
      .pipe(gulp.dest('dist/'));
  });

  gulp.task('wiredep-tmp', function (){
    return gulp.src(src + '/*.html')
      .pipe(wiredep({
        directory: project.bower.directory
      }))
      .pipe(gulp.dest('.tmp/'));
  });

  gulp.task('wiredep-hot-styles', gulpsync.sync(['wiredep', 'hot-styles']));

  gulp.task('hot-styles', function (){


    var scriptText = '';

    for (var key of Object.keys(project.stylesWebPackConfig.entry)){
      gutil.log(gutil.colors.red(key));
      scriptText += '<script src=\"styles/' + key + '.js\"></script>\n'
    }
    // var hot = '/webpack-dev-server';
    // scriptText += '<script src=\"' + hot + '.js\"></script>\n'


    var tempStream = gulp.src(`${project.isProd ? 'dist/' : '.tmp/'}'index.html'`)
      .pipe(injectString.after('<!-- inject:partials -->', scriptText));

    return tempStream.pipe(gulp.dest(`${project.isProd ? 'dist/' : '.tmp/'}`));

  });
  gulp.task('wiredep', function (){
    return gulp.src(src + '/*.html')
      .pipe(wiredep({
        directory: project.bower.directory
      }))
      .pipe(gulp.dest(`${project.isProd ? 'dist/' : '.tmp/'}`));
  });


}
module.exports = configureTasks;
