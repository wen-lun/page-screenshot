const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const htmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack')

module.exports = {
    entry: './src/page-screenshot.ts',
    output: {
        path: path.resolve(__dirname, 'dev'),
        filename: 'page-screenshot.js'
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    mode: "development",
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
    devServer: {
        publicPath: "/",
        port: 3000,
        compress: true,// 服务器压缩
        hot: true//热更新
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new MiniCssExtractPlugin({
            filename: "page-screenshot.css"
        }),
        new htmlWebpackPlugin({
            hash: true,
            template: './index.html',
            filename: 'index.html'
        }),
    ]
};