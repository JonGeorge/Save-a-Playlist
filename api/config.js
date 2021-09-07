const router = require("express").Router(),
      frontendConfig = require("../config/frontend");

router.get("/", (req, res) => {
    let config = frontendConfig;

    config.isLoggedIn = req.session.isLoggedIn;

    res.json(config);
});

module.exports = router;