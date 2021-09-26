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
    mode: "production",
    entry: ["./public/appConfig.js",
        "./public/login.js",
        "./public/addEventListeners.js"],
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js",
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