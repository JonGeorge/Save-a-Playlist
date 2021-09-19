const router = require("express").Router();
const log = require("../services/log");
const playlist = require("../services/playlist");
const { getFormattedDateStr } = require("../services/utils");

router.post("/", (req, res) => {
    log.debug("POST /save -> Save request received ", req.body);
    const { tracksUrl, name, dateTimeStr } = req.body;
    const date = getFormattedDateStr(dateTimeStr);
    
    const playlistDetails = {
        name: decodeURIComponent(name) + " - Saved on " + date,
        description: 'This playlist was copied from "' + name + '" on ' + date + '.',
        public: false,
        tracks: tracksUrl
    };
    
    playlist.createPlaylistFromTracks(
        req.session.user_id,
        req.session.tokens,
        playlistDetails
    )
    .then(response => {
        let data;

        if (response.ok)
            data = {
                status: 200,
                message: "Playlist successfully saved."
            };

        else
            data = {
                status: 500,
                message: "Something is wrong. Spotify could not save the playlist."
            };

        res.send(data);
    })
    .catch(err => log.debug(err));
    
});

module.exports = router;