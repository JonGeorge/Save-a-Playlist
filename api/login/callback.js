const spotifyService = require('../../services/authorizationCode');
const jwtService = require('../../services/jwt');
const log = require('../../services/log');
const config = require('../../config/app');
const { parseCookies } = require('../../services/utils');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const cookies = parseCookies(req);

        // Parse query parameters
        const url = new URL(req.url, `http://${req.headers.host}`);
        const requestState = url.searchParams.get('state');
        const requestCode = url.searchParams.get('code');

        const stateToken = cookies.oauth_state;
        const successRedirectTo = config.redirect.onLoginSuccess;
        const errorRedirectTo = config.redirect.onError;

        // Verify state token
        const storedState = jwtService.verifyStateToken(stateToken);

        log.debug('GET /callback -> Params received from Spotify', {
            'code': requestCode,
            'storedState': storedState,
            'receivedState': requestState
        });

        if (storedState !== requestState) {
            log.debug(`GET /callback -> State mismatch: redirecting to ${errorRedirectTo}`);
            
            // Clear state cookie
            res.setHeader('Set-Cookie', 'oauth_state=; HttpOnly; Max-Age=0; Path=/');
            res.redirect(errorRedirectTo);
            return;
        }

        // Get authorization code tokens with host for dynamic redirect URI
        const host = req.headers.host || req.headers['x-forwarded-host'];
        const tokens = await spotifyService.getAuthorizationCodeTokens(requestCode, host);
        
        log.debug('GET /callback -> Creating JWT with tokens');
        
        // Create JWT payload with session-like data
        const payload = jwtService.createSessionPayload(tokens, tokens.user_id || null, true);
        const authToken = jwtService.generateToken(payload);

        // Set JWT as httpOnly cookie
        const authCookieOptions = [
            `${config.jwt.cookieName}=${authToken}`,
            'HttpOnly',
            'Max-Age=3600', // 1 hour
            'Path=/',
            process.env.NODE_ENV === 'production' ? 'Secure' : '',
            'SameSite=Lax'
        ].filter(Boolean).join('; ');

        // Clear state cookie and set auth cookie
        res.setHeader('Set-Cookie', [
            'oauth_state=; HttpOnly; Max-Age=0; Path=/',
            authCookieOptions
        ]);

        log.debug(`GET /callback -> Redirecting to ${successRedirectTo}`);
        res.redirect(successRedirectTo);
        
    } catch (error) {
        log.debug('GET /callback -> Error in promise chain getting token from Spotify\n', error);
        
        // Clear state cookie on error
        res.setHeader('Set-Cookie', 'oauth_state=; HttpOnly; Max-Age=0; Path=/');
        res.redirect(config.redirect.onError);
    }
};
