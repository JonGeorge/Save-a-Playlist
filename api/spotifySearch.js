const router             = require("express").Router(),
      spotifyService     = require("../services/search"),
      jwtService         = require("../services/jwt"),
      config             = require("../config/app"),
      log                = require("../services/log");

/**
 * Route used for searching Spotify via the Spotify search api.
 * We are expecting the following URL query parameters:
 *      q: the search query
 *      typeahead: true if typeahead results are desired
 * 
 * i.e. /search?q=SomeQuery&typeahead=true
 * 
 * For additional information on the Spotify search api, see:
 * 
 * https://developer.spotify.com/documentation/web-api/reference/search/search/
 */
router.get("/", (req, res) => { 
    log.debug("GET /search ->", "query = " + req.query.q);
    
    const query = req.query.q,
          isTypeahead = req.query.typeahead === "true";

    // Get JWT token from cookies
    const authToken = req.cookies[config.jwt.cookieName];
    let token = null;

    if (authToken) {
        const decoded = jwtService.verifyToken(authToken);
        if (decoded && decoded.tokens && decoded.tokens.access_token) {
            token = decoded.tokens.access_token;
        }
    }

    spotifyService.search(query, isTypeahead, token)
    .then(result => {
        res.status(200).json(result);
    })
    .catch(error => {
        console.log(error);
        res.status(500).json({ error: "Search failed" });
    });


    

});

module.exports = router;