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
        const token = req.session.tokens ? req.session.tokens.access_token : undefined;
        let userId = req.session.user_id;

        // If we already have user id in the session, continue to next handler
        if(userId !== undefined && token !== undefined) {
                log.debug("AuthChecker.viaSpotify() -> User id already in session");
                return next();
        }

        // After logging in, the session user id will be undefined
        // We will need to ask Spotify for it and add it to session
        else if(userId === undefined && token !== undefined) {
                log.debug("AuthChecker.viaSpotify() -> Getting Spotify User Id...");

                user.getUserId(token)
                .then(response => {
                    req.session.user_id = response;
                    log.debug("User id retrieved from Spotify -> " + userId);
        
                    return next();
                })
                .catch(err => {
                    log.debug("Could not get Spotify user id.", err);

                    const data = {
                        status: 403,
                        message: "Could not get user id"
                    };
                    return res.send(data);
                });
        }

        // No access_token found
        else {
            log.debug("AuthChecker.viaSpotify() -> No access_token found");

            const data = {
                status: 401,
                message: "Spotify account not connected"
            };
            return res.send(data);
        }
    },
};