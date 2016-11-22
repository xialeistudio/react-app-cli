var path = require('path');
var fs = require('fs');
var autoprefixer = require('autoprefixer');
var precss = require('precss');
var webpack = require('webpack');
//plugin
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var AssetsPlugin = require('assets-webpack-plugin');
var assetsPluginInstance = new AssetsPlugin({
  filename: __dirname + '/dist/manifest.json'
});
var plugins = [];
var entry = {
  app: './src/app.jsx'
};
if (process.env.NODE_ENV === 'production') {
  plugins = [
    new CleanWebpackPlugin(['dist'], {
      verbose: true,
      root: __dirname
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new ExtractTextPlugin('/[name].[chunkhash].css'),
    assetsPluginInstance
  ];
  entry.vendor = ['react', 'react-router', 'react-dom'];
} else {
  plugins = [
    new ExtractTextPlugin('/bundle.css')
  ];
}
module.exports = {
  entry: entry,
  output: {
    sourceMapFilename: '[file].map',
    publicPath: process.env.NODE_ENV === 'production' ? '/dist' : 'http://localhost:8000/dist',
    filename: process.env.NODE_ENV === 'production' ? '/[name].[chunkhash].js' : '/bundle.js',
    path: './dist'
  },
  postcss: function () {
    return {
      defaults: [precss, autoprefixer],
      cleaner: [autoprefixer({browsers: ['ios >= 7', 'android >= 4.0']})]
    };
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loaders: ['babel-loader', 'eslint-loader']},
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react', 'stage-3']
        }
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        loaders: [
          'file?name=/img/[hash:16].[ext]'
        ]
      },
      {test: /\.css$/, loader: ExtractTextPlugin.extract('style', 'css!postcss')},
      {test: /\.scss$/, loader: ExtractTextPlugin.extract('style', 'css!postcss!sass')},
      {test: /\.less/, loader: ExtractTextPlugin.extract('style', 'css!postcss!less')},
      {test: /\.(eot|svg|ttf|woff)/, loader: 'file?name=fonts/[hash].[ext]'}
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins: plugins
};