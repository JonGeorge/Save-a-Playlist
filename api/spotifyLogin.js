const router              = require("express").Router(),
      spotifyService      = require("../services/authorizationCode"),
      jwtService          = require("../services/jwt"),
      log                 = require("../services/log"),
      config              = require("../config/app"),
      successRedirectTo   = config.redirect.onLoginSuccess,
      errorRedirectTo     = config.redirect.onError;

/**
 * Entry point for the /login route initiates the Authorization Code
 * flow by requesting an Authorization Code as per the specification
 * outlined at the following links:
 * 
 * https://tools.ietf.org/html/rfc6749#section-4.1
 * https://developer.spotify.com/documentation/general/guides/authorization-guide/
 */
router.get("/", (req, res) => {
    // Check for existing JWT token
    const token = req.cookies[config.jwt.cookieName];
    if(token) {
        const decoded = jwtService.verifyToken(token);
        if(decoded && decoded.tokens && decoded.tokens.access_token) {
            log.debug(`GET /login -> Existing token found. Redirecting to ${successRedirectTo}`);
            res.redirect(successRedirectTo);
            return;
        }
    }
        
    log.debug("GET /login -> No valid token found, going to authenticate via Spotify.");
    const { url, state } = spotifyService.getAuthUrlWithState(req.headers.host);

    // Create state token instead of session storage
    const stateToken = jwtService.createStateToken(state);
    res.cookie('oauth_state', stateToken, { 
        httpOnly: true, 
        maxAge: 10 * 60 * 1000, // 10 minutes
        secure: process.env.NODE_ENV === 'production'
    });

    log.debug("GET /login  ->", `Set state token and redirecting to ${url}`);
    res.redirect(url);
});

/**
 * This route is used by Spotify after an Authorization Code has been requested.
 * The Authorization Code will be returned from Spotify in the http request
 * made to this route and can be exchanged for access and refresh tokens.
 */
router.get("/callback", (req, res) => {
    const stateToken        = req.cookies.oauth_state,
          requestState      = req.query.state,
          requestCode       = req.query.code;

    // Verify state token
    const storedState = jwtService.verifyStateToken(stateToken);

    log.debug("GET /callback -> Params recieved from Spotify", {
        "code"           : requestCode,
        "storedState"    : storedState,
        "recievedState"  : requestState
    });

    if(storedState !== requestState) {
        log.debug(`GET /callback -> State mismatch: redirecting to ${errorRedirectTo}`);
        res.clearCookie('oauth_state');

        log.debug(`GET /callback -> Redirecting to ${errorRedirectTo}`);
        res.redirect(errorRedirectTo);
        return;
    }

    spotifyService.getAuthorizationCodeTokens(requestCode)
    .then(tokens => {
        log.debug("GET /callback -> Creating JWT with tokens");
        
        // Create JWT payload with session-like data
        const payload = jwtService.createSessionPayload(tokens, tokens.user_id || null, true);
        const authToken = jwtService.generateToken(payload);

        // Set JWT as httpOnly cookie
        res.cookie(config.jwt.cookieName, authToken, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000, // 1 hour
            secure: process.env.NODE_ENV === 'production'
        });

        // Clear state token
        res.clearCookie('oauth_state');

        log.debug(`GET /callback -> Redirecting to ${successRedirectTo}`);
        res.redirect(successRedirectTo);
    })
    .catch(error => {
        log.debug("GET /callback -> Error in promise chain getting token from Spotify\n", error);
        res.clearCookie('oauth_state');
        log.debug(`GET /callback -> Redirecting to ${errorRedirectTo}`);
        res.redirect(errorRedirectTo);
    });
});

module.exports = router;