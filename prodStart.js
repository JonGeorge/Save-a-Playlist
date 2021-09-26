const app                     = require("./app");
const config                  = require("./config/app");
const clientCredentialService = require("./services/clientCredential");
const spotify                 = require("./config/spotify");

app.listen(config.port, () => {
    // Save a Spotify token using 'client credentials flow'
    // and refresh it at intervals based on config
    clientCredentialService.beginCycle(
        spotify.token.clientCredentialsTokenRefreshInterval
    );

    console.log(`Listening on port ${config.port}`);
});