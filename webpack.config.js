const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const extractLESS = new ExtractTextPlugin('page-screenshot.css');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    entry: './src/page-screenshot.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'page-screenshot.js'
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
            {
                test: /\.less$/,
                use: extractLESS.extract(['css-loader', 'less-loader']),
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
        extractLESS,
        new CleanWebpackPlugin(['dist/', "types"])
    ]
};