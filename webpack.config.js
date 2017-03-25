const path = require('path');
const webpack = require('webpack');
const DefinePlugin = require('webpack/lib/DefinePlugin');

function root(relunixpath) {
    let fullpath = [__dirname].concat(relunixpath.split('/'));
    return path.join(...fullpath);
}

module.exports = {
    devtool: 'inline-source-map',

    resolve: {
        extensions: ['.ts', '.js']
    },

    entry: root('src/index.ts'),

    output: {
        path: root('dist'),
        publicPath: '/',
        filename: 'asset-bundle-compiler.umd.js',
        libraryTarget: 'umd',
        library: 'AssetBundleCompiler'
    },

    module: {
        rules: [{
            enforce: 'pre',
            test: /\.ts$/,
            loader: 'tslint-loader',
            exclude: [root('node_modules')]
        }, {
            test: /\.ts$/,
            loader: 'awesome-typescript-loader?declaration=false'
        }]
    }
};
