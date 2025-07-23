const router = require("express").Router();
const path   = require("path");

const log   = require("../services/log");

router.get("/", (req, res) => {
    // console.log(req);
    const file = path.join(__dirname, "../public", "index_wip.html");

    log.debug("GET /  ->", `res.sendFile ${file}`);
    res.sendFile(file);
});

router.get("/error", (req, res) => {
    res.send("There has been an error.");
});

router.get("/success", (req, res) => {
    res.send("Success");
});

module.exports = router;