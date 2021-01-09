const router             = require("express").Router(),
      spotifyService     = require("../services/spotifySearch"),
      spotifyDao         = require("../dao/spotify"),
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
          isTypeahead = req.query.typeahead === "true",
          url = spotifyService.getSearchUrl(query, isTypeahead);

    log.debug("GET /search -> Generated search url = ", url);
    
    token = req.session.access_token;
    const options = spotifyService.getSearchOptions(url, token);

    spotifyDao.search(options)
    .then(response => {
        res.json(response.data); // TODO: update to return appropriate response
    })
    .catch(error => {
        log.debug(error)
        log.debug("Unable to get search.");
    });
    

});

module.exports = router;