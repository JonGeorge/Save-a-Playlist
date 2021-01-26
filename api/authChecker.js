const user = require("../services/user"),
      log = require("../services/log");

module.exports = {
    /**
     * Check if we have a (valid*) Spotify access_token and user id.
     * If we do not have a user id but we have a valid token, we attempt
     * to get the user id and set the user id to the session.
     * 
     * @param {object} req Express http request body
     * @param {object} res Express http response
     * @param {function} next Express next middleware
     * 
     * @returns undefined
     */
    viaSpotify: (req, res, next) => {
        // If we already have user id in the session, continue to next handler
        if(req.session.user_id !== undefined && 
            req.session.access_token !== undefined) {
                log.debug("AuthChecker.viaSpotify() -> User id already in session");
                return next();
        }

        // After logging in, the session user id will be undefined
        // We will need to ask Spotify for it and add it to session
        else if(req.session.user_id === undefined && 
            req.session.access_token !== undefined) {
                log.debug("AuthChecker.viaSpotify() -> Getting Spotify User Id...");

                user.getUserId(req.session.access_token)
                .then(userId => {
                    req.session.user_id = userId;
                    log.debug("User id retrieved from Spotify -> " + userId);
        
                    return next();
                })
                .catch(err => {
                    log.debug(err);
                    return res.status(403).send("Could not get user id").end();
                });
        }

        // No access_token found
        else {
            log.debug("DEBUG >>>> ", req.session.user_id, req.session.access_token);
            return res.status(401).send("Spotify account not connected").end();
        }
    },
};