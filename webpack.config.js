/*
 * lecture-slides.js (https://www.buzzlms.de)
 * © 2017  Dennis Schulmeister-Zimolong <dennis@pingu-mail.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */
"use strict";

// Imports
const fs = require("fs");
const path = require("path");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require("webpack");

// Webpack base configuration
const extractCSS = new ExtractTextPlugin("style.css");

let webpackConfig = {
    entry: {
        "learning-slides.vendor": ["jquery", "bootstrap", "highlight.js",],
        "learning-slides.app": path.join(__dirname, "src", "app.js"),
    },
    output: {
        filename: "[name].bundle.js",
        path: path.join(__dirname, process.env.npm_package_config_build_dir),
        publicPath: `${process.env.npm_package_config_public_url}/`,
    },
    devtool: process.env.NODE_ENV == "production" ? "nosources-source-map" : "eval-source-map",
    //devtool: "nosources-source-map",
    devServer: {
        // In theory setting historyApiFallback to true allows to test the
        // single page app without hashbang URLs (no # in the URL).
        // In reality it breaks source maps. So we set it to false and
        // enable hashbang URLs in config.js.
        //historyApiFallback: true,
    },

    module: {
        rules: [{
            test: /\.css$/,
            use: extractCSS.extract({
                use: [
                    "css-loader?localIdentName=[name]__[local]___[hash:base64:5]",
                ],
                fallback: "style-loader",
            }),
        }, {
            test: /\.less$/,
            use: extractCSS.extract({
                use: [
                    "css-loader?localIdentName=[name]__[local]___[hash:base64:5]",
                    "less-loader",
                ],
                fallback: "style-loader",
            }),
        },{
            test: /\.(svg|jpg|png|gif|eot|ttf|woff|woff2)$/,
            use: "url-loader",
        },{
            test: /\.(htm|html)/,
            use: "html-loader",
        },],
    },
    plugins: [
        extractCSS,

        new UglifyJSPlugin({
            // cheap source map options don't work with the plugin!
            "sourceMap": true,
        }),
        new webpack.optimize.CommonsChunkPlugin({
            names: "learning-slides.vendor",
            minChunks: Infinity,
        }),
        new webpack.ProvidePlugin({
           $: 'jquery',
           jQuery: 'jquery',
           'window.jQuery': 'jquery',
           Popper: ['popper.js', 'default'],
       }),
    ]
};

// Export configuration
module.exports = webpackConfig;
