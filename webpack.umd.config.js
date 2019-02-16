const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack')

module.exports = {
    entry: './src/page-screenshot.ts',
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: 'page-screenshot.js',
        library: "PageScreenshot",
        libraryTarget: "umd"
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    mode: "production",
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                cache: true,
                parallel: true,
                sourceMap: false
            }),
            new OptimizeCSSAssetsPlugin({})
        ]
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
            {
                test: /\.less$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    'css-loader',
                    'less-loader'
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(png|woff|woff2|svg|ttf|eot)$/,
                use: [
                    { loader: 'file-loader', options: { name: 'fonts/[name].[hash:8].[ext]' } }//项目设置打包到dist下的fonts文件夹下
                ]
            }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new MiniCssExtractPlugin({
            filename: "page-screenshot.css"
        }),
        new CleanWebpackPlugin(['lib/']),
    ]
};