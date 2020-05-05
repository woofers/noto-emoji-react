const path = require('path')
const nodeExternals = require('webpack-node-externals')
const json = require('./package.json')
const getPath = path => path.substring(0, path.lastIndexOf('/'))
const getFile = path => path.substring(path.lastIndexOf('/') + 1)
const mode = process.env.NODE_ENV
const PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin')

module.exports = {
  plugins: [
    new PeerDepsExternalsPlugin(),
  ],
  entry: './lib/index.js',
  output: {
    filename: `[name].js`,
    path: path.resolve(__dirname, 'dist'),
    library: json.name,
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  externals: [nodeExternals()],
  mode: 'production',
  optimization: {
    minimize: true,
    namedChunks: true,
    namedModules: true,
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      maxSize: 0,
    }
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel-loader'
    }]
  }
}
