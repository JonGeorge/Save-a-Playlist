const spotifyDao = require('../../dao/spotify'),
    spotifyConfig = require('../../config/spotify'),
    log = require('../../services/log'),
    { jsonToQueryStr } = require('../../services/utils');

const SpotifyTokenService = {
    /**
     * Builds a Javascript object containing the parameters of a POST request
     * used to obtain access and refresh tokens from Spotify. If the code
     * parameter is falsy, no refresh token will be provided since the Client
     * Credentials flow is executed.
     * 
     * For more info on these parameters vist:
     * https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-code-flow
     * 
     * @param {string} code Authorizatiton code received from Spotify.
     *                      If undefined or falsey, Client Credentials
     *                      flow options are provided.
     * @returns object containing POST request options.
     */
    getTokenOptions: (code, redirectUri) => {
        let data = {
            grant_type: 'client_credentials'
        };

        if(code) {
            data =  {
                'code'          : code,
                'redirect_uri'  : redirectUri || spotifyConfig.auth.options.redirect_uri,
                'grant_type'    : 'authorization_code'
            };
        }
        
        const encodedAuthStr = getEncodedClientIdAndSecret(),
            dataStr        = jsonToQueryStr(data);

        return {
            'method': 'post',
            'url'   : spotifyConfig.token.url,
            'data'  : dataStr,
            'headers': {
                'Authorization' : 'Basic ' + encodedAuthStr,
                'Content-Type'  : 'application/x-www-form-urlencoded'
            },
            'json': true
        };
    },

    getToken: options => {
        return spotifyDao.getToken(options)
            .then(response => response)
            .catch(err => log.debug(err));
    },

    getRefreshTokenOptions: refreshToken => {
        const data = {
            'grant_type'    : 'refresh_token',
            'refresh_token' : refreshToken
        };

        const encodedAuthStr = getEncodedClientIdAndSecret(),
            dataStr        = jsonToQueryStr(data);
        
        return {
            'method': 'post',
            'url'   : spotifyConfig.token.url,
            'data'  : dataStr,
            'headers': {
                'Authorization' : 'Basic ' + encodedAuthStr,
                'Content-Type'  : 'application/x-www-form-urlencoded'
            },
            'json': true
        };
    }
};

/**
 * Encodes this app's Spotify clientId and clientSecret as a Base64 string.
 * 
 * @returns Base64 encoded ClientID:ClientSecret
 */
function getEncodedClientIdAndSecret() {
    const authStr        = spotifyConfig.client_id + ':' + spotifyConfig.client_secret,
        buffer         = new Buffer.from(authStr),
        encodedAuthStr = buffer.toString('base64');

    return encodedAuthStr;
}
module.exports = SpotifyTokenService;
