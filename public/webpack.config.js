const path = require("path");

module.exports = {
    mode    : "development",
    entry   : ["./public/appConfig.js",
                "./public/login.js",
                "./public/addEventListeners.js"],
    output  : {
        path    : path.join(__dirname, "dist"),
        filename: "[name].js"
    },
};