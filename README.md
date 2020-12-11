## Description
This build system speeds up local development - any change under 5 seconds, and makes dist build for dev/stage/prod
 
#### How to use it

```
uninstall webpack and webpack-dev-server from global!!!
sudo npm -g uninstall webpack webpack-dev-server

*in ubo-frontend project*
 
package.json:(dependencies) 

    replace 
em-project-builder 
    with 
"em-project-dev": "1.0.2"


Gulpfile.js:
    replace 
require('em-project-builder')
    with 
require('em-project-dev')


rm -rf node_modules
npm install
bower install
cex install


copy the following files over existing ones 
cp defaults/package.json -> ubo-frontend/package.json
cp defaults/Gulpfile.js -> ubo-frontend/Gulpfile.js

then run : 
gulp --env=dev serve

```


#### dist build
```
gulp build --env=prod && docker build -t ubo . && docker run -p 9000:80 ubo
```



#### added tasks for running dist build
```
gulp serve:dist --env=dev          -> minifies files and run wds
gulp serve:dist-no-min --env=dev   -> does not minify js files (like stage build, just concat)
```



### Publish
```
npm version patch
npm publish
```
