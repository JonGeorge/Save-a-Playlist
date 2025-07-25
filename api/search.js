const spotifyService = require('../services/search');
const { auth, sanitize, middleware } = require('../security');
const config = require('../config/app');
const log = require('../services/log');
const { parseCookies } = require('../services/utils');

/**
 * Parses and validates search parameters from request
 */
function parseSearchParams(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const rawQuery = url.searchParams.get('q');
    const rawTypeahead = url.searchParams.get('typeahead');

    // Validate and sanitize query parameter
    const queryResult = sanitize.process.searchQuery(rawQuery || '', {
        maxLength: 200,
        allowEmpty: false
    });

    if (!queryResult.isValid) {
        throw new Error(`Invalid search query: ${queryResult.errors.join(', ')}`);
    }

    // Validate typeahead parameter
    const typeaheadResult = sanitize.validate.boolean(rawTypeahead);
    const isTypeahead = rawTypeahead === 'true';

    return { 
        query: queryResult.sanitized, 
        isTypeahead,
        validation: {
            query: queryResult,
            typeahead: typeaheadResult
        }
    };
}

/**
 * Extracts user token from JWT cookie if available
 */
function extractUserToken(cookies) {
    const authToken = cookies[config.jwt.cookieName];
    if (!authToken) {
        return null;
    }

    const decoded = auth.jwt.verifyToken(authToken);
    if (decoded?.tokens?.access_token) {
        return decoded.tokens.access_token;
    }

    return null;
}

/**
 * Creates standardized error response
 */
function createErrorResponse(message) {
    return { error: message };
}

/**
 * Searches Spotify playlists using either user token (if logged in) or client credentials
 *
 * Query Parameters:
 * - q: Search query string (required)
 * - typeahead: Boolean flag for typeahead search behavior
 */
module.exports = async (req, res) => {
    return middleware.api.search(req, res, async () => {
        log.debug('Search API:', req.method);

        // Validate HTTP method
        if (req.method !== 'GET') {
            return res.status(405).json(createErrorResponse('Method not allowed'));
        }

        try {
        // Parse request data
            const cookies = parseCookies(req);
            const { query, isTypeahead, validation } = parseSearchParams(req);

            log.debug('Search request:', { query, isTypeahead, validation });

            // Extract user token (optional - falls back to client credentials)
            const userToken = extractUserToken(cookies);
            if (userToken) {
                log.debug('Using user token for authenticated search');
            } else {
                log.debug('Using client credentials for anonymous search');
            }

            // Perform search
            const result = await spotifyService.search(query, isTypeahead, userToken);
            res.status(200).json(result);

        } catch (error) {
            // Handle validation errors specifically
            if (error.message.includes('Invalid search query')) {
                log.debug('Search validation error:', error.message);
                return res.status(400).json(createErrorResponse(error.message));
            }
            
            log.error('Search error:', error);
            res.status(500).json(createErrorResponse('Search failed'));
        }
    });
};
