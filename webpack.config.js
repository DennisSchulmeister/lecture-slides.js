/*
 * lecture-slides.js (https://www.buzzlms.de)
 * © 2017 – 2019 Dennis Schulmeister-Zimolong <dennis@pingu-mail.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */
"use strict";

// Imports
const path = require("path");
const webpack = require("webpack");
const env = require('yargs').argv.env;

// Webpack base configuration
// See: https://stackoverflow.com/questions/35131367/create-npm-package-using-webpack
let webpackConfig = {
    entry: {
        "learning-slides": path.join(__dirname, "src", "index.js"),
    },

    output: {
        filename: "[name].js",
        path: path.join(__dirname, process.env.npm_package_config_build_dir),
        library: "[name]",
        libraryTarget: "umd",
        umdNamedDefine: true,
    },

    externals: {
        jquery: "jquery",
        bootstrap: "bootstrap",
    },

    devtool: "source-map",

    module: {
        rules: [{
            test: /\.css$/,
            use: extractCSS.extract({
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            modules: "global",
                            localIdentName: '[path][name]__[local]--[hash:base64:5]',
                        },
                    },
                ],
                fallback: "style-loader",
            }),
        }, {
            test: /\.less$/,
            use: extractCSS.extract({
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            modules: "global",
                            localIdentName: '[path][name]__[local]--[hash:base64:5]',
                        },
                    },
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
        new webpack.ProvidePlugin({
           $: 'jquery',
           jQuery: 'jquery',
           'window.jQuery': 'jquery',
           Popper: ['popper.js', 'default'],
       }),
    ],
};

// Export configuration
module.exports = webpackConfig;
