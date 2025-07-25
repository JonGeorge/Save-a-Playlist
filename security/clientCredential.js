const spotify            = require('../config/spotify'),
    log                = require('../services/log'),
    tokenService       = require('./token');


module.exports = {
    beginCycle: (interval) => {
        // set token on server startup
        setClientCredentialsToken();

        // then refresh token at intervals thereafter
        refreshClientCredentialsTokenAtIntervals(interval);
    }
};

/**
 * Gets a new Spotify token every 'delay' milliseconds, and sets the Client
 * Credentials token in the Spotify config.
 * 
 * @param {number} delay The amount of time before a new token is requested
 *                       using the Client Credentials flow. 
 * @returns undefined
 */
function refreshClientCredentialsTokenAtIntervals(delay) {
    const timer = setInterval(function() {
        setClientCredentialsToken();
        clearInterval(timer);

        refreshClientCredentialsTokenAtIntervals(delay);
    }, delay);
}

/**
 * Sets the config to the token received via the Client Credentials flow.
 * 
 * @returns undefined
 */
function setClientCredentialsToken() {
    getNewClientCredentialsToken()
        .then(token => {
            spotify.token.clientCredentialsToken = token.access_token;
        })
        .catch(error => {
            log.debug(error);
        });
}

/**
 * Gets the axios http request options for the Client Credentials api request.
 * 
 * @returns Promise containing the retrieved token object in the response.
 *          {access_token: "someaccesstoken"}
 */
function getNewClientCredentialsToken() {
    const options = tokenService.getTokenOptions();
    return tokenService.getToken(options)
        .then(response => response)
        .catch(err => log.debug(err));
}



