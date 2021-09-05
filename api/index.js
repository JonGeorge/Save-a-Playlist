const router = require("express").Router();
const path    = require("path");

const log   = require("../services/log");

router.get("/", (req, res) => {
    const file = path.join(__dirname, "../public", "index_wip.html");

    if(req.session.count) req.session.count++;
    else req.session.count = 1;

    log.debug("GET /  ->", `res.sendFile ${file}`);
    res.sendFile(file);
    // res.json(req.session); // Used for debugging
});

router.get("/error", (req, res) => {
    res.send("There has been an error.");
});

router.get("/success", (req, res) => {
    res.send("Success");
});

module.exports = router;