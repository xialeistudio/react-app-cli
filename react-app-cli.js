#!/usr/bin/env node
var commander = require('commander');
var inquirer = require('inquirer');
var version = require('./package.json').version;
var Promise = require('bluebird');
var fs = require('fs');
var shelljs = require('shelljs');
var mkdirp = require('mkdirp');
Promise.promisifyAll(fs);
/**
 * 环境设定
 * @param appName
 */
function showQuestion(appName) {
  var questions = [
    {
      type: 'list',
      name: 'stylesheet',
      message: '请选择使用的CSS语法',
      choices: ['css', 'less', 'scss']
    }
  ];
  inquirer.prompt(questions).then(function (answers) {
    createApp(appName, answers);
  });
}

/**
 * webpack配置
 * @param rootPath
 * @returns {Promise}
 */
function webpackConfig(rootPath) {
  return fs.readFileAsync(__dirname + '/template/webpack.config.js').then(function (data) {
    data = data.toString().replace(/<%root%>/g, rootPath);
    return data;
  });
}

/**
 *
 * @param name
 * @param options
 */
function createApp(name, options) {
  console.log('正在初始化');
  console.time('初始化完成');
  var root = name;
  mkdirp(root + '/src/styles', function (e) {
    if (e !== null) {
      return console.error(e);
    }
    fs.writeFileAsync(root + '/src/styles/app.' + options.stylesheet, '/*样式表*/')
    //创建webpack
      .then(function () {
        return webpackConfig(root);
      })
      .then(function (webpackConfig) {
        return fs.writeFileAsync(root + '/webpack.config.js', webpackConfig);
      })
      //创建app.jsx
      .then(function () {
        return fs.writeFileAsync(root + '/src/app.jsx', 'import \'./styles/app.' + options.stylesheet + '\';')
      })
      //写入package.json
      .then(function () {
        var json = {
          name: name,
          version: '0.0.1',
          scripts: {
            start: 'webpack-dev-server --progress --colors --port 8000',
            build: 'cross-env NODE_ENV=production webpack -p --progress --colors'
          }
        };
        return fs.writeFileAsync(root + '/package.json', JSON.stringify(json, null, 2))
      })
      //安装依赖
      .then(function () {
        var devDependencies = [
          'precss',
          'autoprefixer',
          'react',
          'react-router',
          'react-dom',
          'assets-webpack-plugin',
          'babel-core',
          'babel-loader',
          'css-loader',
          'babel-preset-es2015',
          'babel-preset-react',
          'babel-preset-stage-3',
          'clean-webpack-plugin',
          'extract-text-webpack-plugin',
          'file-loader',
          'postcss-loader',
          'style-loader',
          'url-loader',
          'webpack',
          'eslint',
          'eslint-loader',
          'babel-eslint',
          'eslint-plugin-react',
          'cross-env'
        ];
        if (options.stylesheet === 'less') {
          devDependencies.push('less-loader');
        } else if (options.stylesheet === 'scss') {
          devDependencies.push('node-sass');
          devDependencies.push('sass-loader');
        }
        shelljs.exec('cd ' + root + '&&npm install ' + devDependencies.join(' ') + ' --save-dev', {silent: true}, function () {
          console.timeEnd('初始化完成');
          console.log('使用方法：\nnpm run start\t开发模式\nnpm run build\t生产模式');
        });
      })
      .catch(function (e) {
        console.error(e);
      });
  });
}

commander
  .version(version)
  .arguments('<app-name>')
  .description('创建项目')
  .action(function (appName) {
    showQuestion(appName);
  })
  .parse(process.argv);