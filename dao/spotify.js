const axios = require('axios');
const log = require('../services/log');

/**
 * Validates and extracts error message from axios error response
 * @param {Error} error - Axios error object
 * @returns {string} Formatted error message
 */
function extractErrorMessage(error) {
    return error.response?.data?.error_description ||
           error.response?.data?.error ||
           error.message;
}

/**
 * Creates a deep copy of request options with updated authorization header
 * @param {object} options - Original request options
 * @param {string} accessToken - New access token
 * @returns {object} Updated request options
 */
function createUpdatedRequestOptions(options, accessToken) {
    const newOptions = JSON.parse(JSON.stringify(options));
    newOptions.headers.Authorization = 'Bearer ' + accessToken;
    return newOptions;
}

/**
 * Refreshes expired Spotify access token using refresh token
 * @param {string} refreshToken - Valid refresh token
 * @returns {Promise<string>} New access token
 * @throws {Error} When token refresh fails
 */
function refreshAccessToken(refreshToken) {
    const tokenService = require('../security/token');
    const options = tokenService.getRefreshTokenOptions(refreshToken);

    log.debug('Refreshing expired access token...');

    return axios(options)
        .then(response => {
            // Validate response structure
            if (!response.data || !response.data.access_token) {
                throw new Error('Invalid token response: missing access_token');
            }

            log.debug('Access token refreshed successfully');
            return response.data.access_token;
        })
        .catch(error => {
            const errorMsg = extractErrorMessage(error);
            log.error('Token refresh failed:', errorMsg);
            throw new Error(`Could not refresh access token: ${errorMsg}`);
        });
}

/**
 * Retries a failed request with a new access token
 * @param {string} newAccessToken - Fresh access token
 * @param {object} originalOptions - Original request options
 * @returns {Promise<object>} API response data
 * @throws {Error} When retry request fails
 */
function retryRequestWithNewToken(newAccessToken, originalOptions) {
    log.debug('Retrying request with refreshed access token');

    const updatedOptions = createUpdatedRequestOptions(originalOptions, newAccessToken);

    return axios(updatedOptions)
        .then(response => response.data)
        .catch(error => {
            const errorMsg = extractErrorMessage(error);
            log.error('Retry request failed after token refresh:', errorMsg);
            throw new Error(`Request failed after token refresh: ${errorMsg}`);
        });
}

const SpotifyDao = {
    /**
     * Exchanges authorization code or client credentials for access tokens
     *
     * Supports both OAuth flows:
     * - Authorization Code Flow: Returns access_token + refresh_token
     * - Client Credentials Flow: Returns access_token only
     *
     * @param {object} options - Axios request configuration
     * @returns {Promise<object>} Token response with access_token, refresh_token, expires_in
     * @throws {Error} When token request fails
     */
    getToken: (options) => {
        log.debug('SpotifyDao.getToken() - Requesting tokens from Spotify');

        return axios(options)
            .then(response => {
                log.debug('Token retrieved successfully');

                return {
                    access_token: response.data.access_token,
                    refresh_token: response.data.refresh_token,
                    expires_in: response.data.expires_in,
                    error: response.data.error,
                    error_description: response.data.error_description
                };
            })
            .catch(error => {
                const errorMsg = extractErrorMessage(error);
                log.error('Token request failed:', errorMsg);
                throw new Error(`Could not get token from Spotify API: ${errorMsg}`);
            });
    },

    /**
     * Creates standardized request options for Spotify API calls
     *
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {string} url - Spotify API endpoint URL
     * @param {string} token - Bearer access token
     * @param {object|string} [data] - Request body data (optional)
     * @returns {object} Axios request configuration
     */
    getJsonRequestOptions: function(method, url, token, data) {
        const options = {
            method: method,
            url: url,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            json: true
        };

        // Add request body if provided
        if (data) {
            options.data = typeof data === 'string' ? data : JSON.stringify(data);
        }

        return options;
    },

    /**
     * Makes authenticated requests to Spotify API with automatic token refresh
     *
     * Features:
     * - Automatic retry on 401 (token expired) with refresh token
     * - Comprehensive error handling and logging
     * - Prevents infinite retry loops
     *
     * @param {object} options - Axios request configuration
     * @param {string} [refreshToken] - Refresh token for automatic token refresh
     * @returns {Promise<object>} API response data
     * @throws {Error} When request fails or authentication cannot be recovered
     */
    request: (options, refreshToken) => {
        log.debug('SpotifyDao.request() - Making API request to Spotify');

        return axios(options)
            .then(response => {
                log.debug('Spotify API request successful');
                return response.data;
            })
            .catch(error => {
                // Handle token expiration (401 Unauthorized)
                if (error.response?.status === 401) {
                    log.debug('Access token expired (401), attempting refresh...');

                    if (refreshToken) {
                        return refreshAccessToken(refreshToken)
                            .then(newAccessToken => {
                                return retryRequestWithNewToken(newAccessToken, options);
                            })
                            .catch(refreshError => {
                                log.error('Token refresh failed, request cannot be completed:', refreshError.message);
                                throw new Error(`Authentication failed: ${refreshError.message}`);
                            });
                    } else {
                        const errorMsg = extractErrorMessage(error);
                        throw new Error(`No refresh token available for expired access token: ${errorMsg}`);
                    }
                }

                // Handle all other API errors
                const errorMsg = extractErrorMessage(error);
                log.error('Spotify API request failed:', errorMsg);
                throw new Error(`Spotify API error: ${errorMsg}`);
            });
    }
};

module.exports = SpotifyDao;
