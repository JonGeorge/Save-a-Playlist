const axios = require('axios');
const log   = require('../services/log');

const SpotifyDao = {
    /**
     * Makes http request based on options provided. The response is expected
     * to contain a data object with access_token and refresh_token properties
     * if the Authorization Code flow was executed. If the Client Credentials
     * flow was executed, refresh_token is undefined.
     * 
     * @param {object} options used in the axios http request.
     * @returns Promise containing access and refresh tokens in an object.
     */
    getToken: options => {
        log.debug('SpotifyDao.getToken()', options);

        return axios(options)

            .then(response => {
                log.debug('Token retrieved successfully.');

                return {
                    access_token    : response.data.access_token,
                    refresh_token   : response.data.refresh_token,
                    expires_in      : response.data.expires_in,
                    error           : response.data.error,
                    error_description: response.data.error_description
                };
            })

            .catch(error => {
                log.debug('Token request error:', error.response?.data || error.message);
                const errorMsg = error.response?.data?.error_description || error.response?.data?.error || error.message;
                throw new Error(`Could not get token from Spotify API: ${errorMsg}`);
            });
    },

    /**
     * Generates an object to be used in a call to the axios() method.
     * 
     * @param {string} method Http method
     * @param {string} url Endpoint
     * @param {object} data Data to be sent in the request body
     * @param {string} token Bearer access token tied to this request
     */
    getJsonRequestOptions: function(method, url, token, data) {
        const options = {
            'method': method,
            'url': url,
            'headers': {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            'json': true
        };

        if(data) 
        {options.data = typeof(data) === 'string' ? data : JSON.stringify(data);}

        return options;
    },

    /**
     * Makes http request based on options provided. The response is expected
     * to contain a data object. If the returned response status is 401, we
     * refresh the access token and retry the original request.
     *
     * For additional information on the Spotify  api, see:
     * https://developer.spotify.com/documentation/web-api/reference/
     * 
     * @param {object} options Options used in acios request.
     * @param {string} refreshToken Refresh token used if access token expired.
     * @returns Promise containing http response from Spotify
     */
    request: (options, refreshToken) => {
        log.debug('SpotifyDao.request()', options);

        return axios(options)

            .then(response => {
                return response.data;
            })

            .catch(error => {
                if(error.response.status === 401) {
                    log.debug("SpotifyDao.request() -> Token isn't authorized");

                    if(refreshToken) {
                        return getNewAccessToken(refreshToken)
                            .then(newAccessToken => {
                                return retryRequest(newAccessToken, options);
                            })
                            .catch(err => log.debug(err));
                    }
                    else {
                        throw new Error('Could not use refreshed access token. ' +
                    error);
                    }
                }
                else {
                    throw new Error('There was an error using the Spotify API. ' +
                error);
                }
            });
    }    
};

function getNewAccessToken(refreshToken) {
    const options = require('../services/token').getRefreshTokenOptions(refreshToken);

    log.debug('Refreshing our access token...');

    return axios(options)
        .then(token => token.access_token)
        .catch(error => {
            throw new Error('Could not get new access token using refresh token. ' +
        error);
        });
}

function retryRequest(newAccessToken, options) {
    log.debug('Retrying request with refreshed access token');
                    
    const newOptions = JSON.parse(JSON.stringify(options));
    newOptions.headers.Authorization = 'Bearer ' + newAccessToken;

    return SpotifyDao.request(newOptions)
        .catch(err => log.debug(err));
}

module.exports = SpotifyDao;
