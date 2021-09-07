const router              = require("express").Router(),
      spotifyService      = require("../services/authorizationCode"),
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
    if(req.session.access_token) {
        log.debug(`GET /login -> Existing token found. Redirecting to ${successRedirectTo}`);
        res.redirect(successRedirectTo);
        return;
    }
        
    log.debug("GET /login -> No session token found, going to authenticate via Spotify.");
    const { url, state } = spotifyService.getAuthUrlWithState(req.headers.host);

    log.debug("GET /login  ->", `Set session {state: ${state}}`);
    req.session.state = state;

    log.debug("GET /login  ->", `Redirecting to ${url}`);
    res.redirect(url);
});

/**
 * This route is used by Spotify after an Authorization Code has been requested.
 * The Authorization Code will be returned from Spotify in the http request
 * made to this route and can be exchanged for access and refresh tokens.
 */
router.get("/callback", (req, res) => {
    const sessionState      = req.session.state,
          requestState      = req.query.state,
          requestCode       = req.query.code;

    log.debug("GET /callback -> Params recieved from Spotify", {
        "code"           : requestCode,
        "storedState"    : sessionState,
        "recievedState"  : requestState
    });

    if(sessionState !== requestState) {
        log.debug(`GET /callback -> State mismatch: redirecting to ${errorRedirectTo}`);
        delete req.session.state;

        log.debug(`GET /callback -> Refirecting to ${errorRedirectTo}`);
        res.redirect(errorRedirectTo);
        return;
    }

    spotifyService.getAuthorizationCodeTokens(requestCode)
    .then(tokens => {
        log.debug("GET /callback -> Writing tokens to session");
        req.session.tokens = tokens;

        req.session.isLoggedIn = true;

        log.debug(`GET /login -> Redirecting to ${successRedirectTo}`);
        res.redirect(successRedirectTo);
    })
    .catch(error => {
        log.debug("GET /callback -> Error in promise chain getting token from Spotify\n", error);
        log.debug(`GET /callback -> Refirecting to ${errorRedirectTo}`);
        res.redirect(errorRedirectTo);
    });
});

module.exports = router;