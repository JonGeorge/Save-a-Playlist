const log = require('../../services/log');
const appConfig     = require('../../config/app'),
    spotifyConfig = require('../../config/spotify'),
    tokenService  = require('./token'),
    { jsonToQueryStr, getRandomString } = require('../../services/utils');

const SpotifyLoginService = {
    /**
     * Generates a URL that can be used to obtain an authorization
     * code from Spotify. The authorization code received from Spotitfy
     * can be exchanged for access and refresh tokens.
     * 
     * Spotify documentation: 
     * https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-code-flow
     * 
     * @param {String} host The value of the host header receieved from the
     *                      client's http request.
     * @returns object containing the spotify auth URL and a randomly generated
     *          string to represent the state.
     */
    getAuthUrlWithState: (host) => {
        const state     = getRandomString(32),
            protocol  = appConfig.protocol,
            path      = spotifyConfig.auth.redirectPath;

        const options = spotifyConfig.auth.options;
        let url = spotifyConfig.auth.base + '?';
            
        options.state = state;
        options.redirect_uri = `${protocol}${host}${path}`;

        url += jsonToQueryStr(options);

        return { url, state };
    },

    /**
     * Attempts to retrieve access and refresh tokens from Spotify
     * using the Authorization Code flow.
     * 
     * @param {string} code Authorization code received from Spotify.
     *                      If undefined or falsey, Client Credentials
     *                      flow is executed.
     * @param {string} host The value of the host header received from the
     *                      client's http request (used for redirect URI).
     * @returns Promise to complete an http request in an attempt to
     *          retrieve access and refresh tokens from Spotify.
     */
    getAuthorizationCodeTokens: (code, host) => {
        // Build the redirect URI dynamically
        const protocol = appConfig.protocol;
        const path = spotifyConfig.auth.redirectPath;
        const redirectUri = host ? `${protocol}${host}${path}` : spotifyConfig.auth.options.redirect_uri;
        
        const options = tokenService.getTokenOptions(code, redirectUri);
        
        return tokenService.getToken(options)
            .then((token) => {
                return token;
            })
            .catch(ex => log.error('Authorization code error:', ex));
    }
};

module.exports = SpotifyLoginService;
