const router = require("express").Router();
const path   = require("path");

const log   = require("../services/log");

router.get("/", (req, res) => {
    // console.log(req);
    const file = path.join(__dirname, "../public", "index.html");

    if(!req.session.isLoggedIn)
        req.session.isLoggedIn = false;

    log.debug("GET /  ->", `res.sendFile ${file}`);
    res.sendFile(file);
    // res.json(req.session); // Used for debugging
});

router.get("/error", (req, res) => {
    res.send("There has been an error.");
});

router.get("/success", (req, res) => {
    req.session.isLoggedIn = true;

    res.send("Success");
});

module.exports = router;