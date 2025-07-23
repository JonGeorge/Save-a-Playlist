const router = require("express").Router(),
      frontendConfig = require("../config/frontend");

/**
 * This route is used by the frontend on landing page load.
 * The frontend consumes our config/frontend.js data.
 */
router.get("/", (req, res) => {
    // Make a copy of our JS object so we dont mutate the original config
    let config = frontendConfig;

    config.isLoggedIn = req.session;

    res.json(config);
});

module.exports = router;