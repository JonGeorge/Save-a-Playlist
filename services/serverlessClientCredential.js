const spotify = require('../config/spotify');
const log = require('../services/log');
const tokenService = require('./token');

// In-memory token cache for serverless (temporary solution)
// In production, you might want to use Vercel KV or another storage solution
const tokenCache = {
    token: null,
    expiresAt: null
};

module.exports = {
    /**
     * Gets a valid client credentials token, either from cache or by requesting a new one
     * @returns {Promise<string>} The access token
     */
    getClientCredentialsToken: async () => {
        // Check if we have a valid cached token
        if (tokenCache.token && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
            log.debug('Using cached client credentials token');
            return tokenCache.token;
        }

        log.debug('Getting new client credentials token');
        
        try {
            // Check if required environment variables are set
            log.debug('Environment check - CLIENT_ID:', process.env.CLIENT_ID ? 'SET' : 'MISSING');
            log.debug('Environment check - CLIENT_SECRET:', process.env.CLIENT_SECRET ? 'SET' : 'MISSING');
            log.debug('Spotify config - client_id:', spotify.client_id ? 'SET' : 'MISSING');
            log.debug('Spotify config - client_secret:', spotify.client_secret ? 'SET' : 'MISSING');
            
            if (!spotify.client_id || !spotify.client_secret) {
                const errorMsg = `Missing Spotify credentials - CLIENT_ID: ${!!spotify.client_id}, CLIENT_SECRET: ${!!spotify.client_secret}`;
                log.debug(errorMsg);
                throw new Error(errorMsg);
            }

            log.debug('Getting new client credentials token with CLIENT_ID:', spotify.client_id);
            const tokenResponse = await getNewClientCredentialsToken();
            
            if (!tokenResponse) {
                throw new Error('No response from Spotify token endpoint');
            }
            
            if (tokenResponse.error) {
                throw new Error(`Spotify API error: ${tokenResponse.error} - ${tokenResponse.error_description}`);
            }
            
            if (!tokenResponse.access_token) {
                throw new Error('No access token in response');
            }
            
            // Cache the token with expiration (subtract 5 minutes for safety)
            const expiresIn = (tokenResponse.expires_in || 3600) * 1000; // Convert to milliseconds
            const safetyMargin = 5 * 60 * 1000; // 5 minutes
            
            tokenCache.token = tokenResponse.access_token;
            tokenCache.expiresAt = Date.now() + expiresIn - safetyMargin;
            
            // Also set it in the spotify config for backward compatibility
            spotify.token.clientCredentialsToken = tokenResponse.access_token;
            
            log.debug('Client credentials token refreshed and cached successfully');
            return tokenResponse.access_token;
            
        } catch (error) {
            log.debug('Error getting client credentials token:', error.message);
            throw new Error(`Unable to authenticate with Spotify: ${error.message}`);
        }
    },

    /**
     * Forces a refresh of the client credentials token
     * @returns {Promise<string>} The new access token
     */
    refreshToken: async () => {
        log.debug('Forcing client credentials token refresh');
        
        // Clear cache to force refresh
        tokenCache.token = null;
        tokenCache.expiresAt = null;
        
        return await module.exports.getClientCredentialsToken();
    }
};

/**
 * Gets a new client credentials token from Spotify
 * @returns {Promise<object>} Token response object
 */
async function getNewClientCredentialsToken() {
    const options = tokenService.getTokenOptions();
    const response = await tokenService.getToken(options);
    return response;
}
