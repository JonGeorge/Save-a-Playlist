const webpack = require("webpack");
const webpackMiddleware = require("webpack-dev-middleware");
const webpackConfig = require("./public/webpack.config");
const compiler = webpack(webpackConfig);

const app                     = require("./app");
const config                  = require("./config/app");
const clientCredentialService = require("./services/clientCredential");
const spotify                 = require("./config/spotify");

app.use(webpackMiddleware(compiler));

app.listen(config.port, () => {
    // Save a Spotify token using 'client credentials flow'
    // and refresh it at intervals based on config
    clientCredentialService.beginCycle(
        spotify.token.clientCredentialsTokenRefreshInterval
    );

    console.log(`Listening on port ${config.port}`);
});