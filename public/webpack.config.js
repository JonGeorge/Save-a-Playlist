/**
 * More info on Webpack config is here:
 * https://webpack.js.org/configuration/
 *
 * CSS Minimizer minifies CSS files
 * https://github.com/webpack-contrib/css-minimizer-webpack-plugin
 *
 * MiniCssExtract extracts CSS into a new file (which is then loaded by css-loader)
 * https://webpack.js.org/plugins/mini-css-extract-plugin/
 *
 * HtmlWebPackPlugin extract html intot a new file (which is then loaded by html-loader
 * https://webpack.js.org/plugins/html-webpack-plugin/)
 *
 */

const path                 = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin   = require("css-minimizer-webpack-plugin");
const HtmlWebpackPlugin    = require("html-webpack-plugin");

const cssExtractPlugin = new MiniCssExtractPlugin({
    filename: "main.css",
});

const cssMinimizerPlugin = new CssMinimizerPlugin({
    test: /\.css$/i
});

const htmlWebpackPlugin = new HtmlWebpackPlugin({
    template: "./public/index_wip.html",
});

module.exports = {
    // Environment - "production" | "developmentt"
    mode: "production",

    // Entry points for dependencies
    entry: ["./public/appConfig.js",
        "./public/login.js",
        "./public/addEventListeners.js"],

    output: {
        // Path where output files will be placed
        path: path.join(__dirname, "dist"),

        // Name for compiled JS file
        filename: "[name].js",

        // Used by url loader to update paths in html
        // Our app.js contains a "/public" route for static files
        publicPath: "/public/",
    },
    plugins: [cssExtractPlugin, htmlWebpackPlugin],
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.html$/i,
                use: ["html-loader"],
            },
            {
                // URL loader does not include img files injected by our JS.
                // We have included import statements in our JS files for the artifacts.
                // File loader will add imported files that match the test regex to our build.
                test: /(alert-circle-outline-red\.svg$)|(check-mark-green\.svg$)/i,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]"
                        },
                    },
                ],
            },
        ],
    },
    optimization: {
        minimizer: [`...`, cssMinimizerPlugin],
    },
};