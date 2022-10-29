'use strict';

const path = require('path');
const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ReactFreshBabelPlugin = require('react-refresh/babel');

const isProduction = process.env.NODE_ENV === 'production';
const isServer = process.env.APP_ENV === 'server';

module.exports = webpack({
    target: isServer ? 'node16' : 'web',
    mode: isProduction ? 'production' : 'development',
    devServer: {
        client: {
            overlay: false,
        },
        hot: true, //ReactRefreshWebpackPlugin
    },
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    entry: [!isProduction && 'webpack-hot-middleware/client', path.resolve(__dirname, '../src/index.js')],
    output: {
        path: path.resolve(__dirname, '../build'),
        filename: 'main.js',
        publicPath: '/',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    targets: isServer
                                        ? {
                                              node: process.versions.node,
                                          }
                                        : '> 1%, not dead',
                                },
                            ],
                            [
                                '@babel/preset-react',
                                {
                                    runtime: 'automatic',
                                    development: !isProduction,
                                },
                            ],
                        ],
                        plugins: [!isProduction && !isServer && ReactFreshBabelPlugin].filter((v) => v),
                    },
                },
            },
        ],
    },
    optimization: {
        concatenateModules: false,
        mergeDuplicateChunks: true,
        flagIncludedChunks: true,
        minimize: isProduction && !isServer,
    },
    plugins: [
        !isServer && !isProduction && new webpack.HotModuleReplacementPlugin(),
        !isServer && !isProduction && new ReactRefreshWebpackPlugin({ overlay: false }),
    ],
});
