const log = require('../services/log');
const config = require('../config/app');
const { parseCookies } = require('../services/utils');
const { auth, middleware } = require('../security');

// ========================================
// Helper Functions
// ========================================

/**
 * Checks if user already has a valid authentication token
 */
function checkExistingAuth(cookies) {
    const authToken = cookies[config.jwt.cookieName];
    if (!authToken) {
        return { isValid: false };
    }

    const decoded = auth.jwt.verifyToken(authToken);
    if (decoded?.tokens?.access_token) {
        return { isValid: true, decoded };
    }

    return { isValid: false };
}

/**
 * Generates OAuth authorization URL and state for Spotify login
 */
function generateSpotifyAuthUrl(req) {
    const host = req.headers.host || req.headers['x-forwarded-host'];
    const { url, state } = auth.authorizationCode.getAuthUrlWithState(host);

    return { authUrl: url, state };
}

/**
 * Creates secure cookie options for OAuth state token
 */
function createStateCookieOptions(stateToken) {
    const cookieOptions = [
        `oauth_state=${stateToken}`,
        'HttpOnly',
        'Max-Age=120', // 2 minutes
        'Path=/',
        process.env.NODE_ENV === 'production' ? 'Secure' : '',
        'SameSite=Lax'
    ].filter(Boolean).join('; ');

    return cookieOptions;
}

// ========================================
// Main Handler
// ========================================

/**
 * Initiates Spotify OAuth login flow
 *
 * Flow:
 * 1. Check if user already has valid token (redirect if yes)
 * 2. Generate Spotify OAuth URL with state parameter
 * 3. Store state in secure cookie for CSRF protection
 * 4. Redirect user to Spotify authorization page
 */
module.exports = async (req, res) => {
    return middleware.oauth(req, res, async () => {
        log.debug('Login API:', req.method);

        // Validate HTTP method
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
        // Parse request data
            const cookies = parseCookies(req);

            // Check for existing authentication
            const { isValid } = checkExistingAuth(cookies);
            if (isValid) {
                log.debug('Existing valid token found, redirecting to app');
                return res.redirect(config.redirect.onLoginSuccess);
            }

            log.debug('No valid token found, initiating Spotify OAuth flow');

            // Generate Spotify OAuth URL and state
            const { authUrl, state } = generateSpotifyAuthUrl(req);

            // Create and store state token for CSRF protection
            const stateToken = auth.jwt.createStateToken(state);
            const cookieOptions = createStateCookieOptions(stateToken);

            res.setHeader('Set-Cookie', cookieOptions);

            // Redirect to Spotify authorization
            log.debug('Redirecting to Spotify OAuth:', { url: authUrl });
            res.redirect(authUrl);

        } catch (error) {
            log.error('Login error:', error);
            res.redirect(config.redirect.onError);
        }
    });
};
