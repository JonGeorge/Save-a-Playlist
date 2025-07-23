const user = require("../services/user"),
      jwtService = require("../services/jwt"),
      config = require("../config/app"),
      log = require("../services/log");

module.exports = {
    /**
     * Check if we have a (valid*) Spotify access_token and user id.
     * If we do not have a user id but we have a valid token, we attempt
     * to get the user id and update the JWT.
     * 
     * @param {object} req Express http request body
     * @param {object} res Express http response
     * @param {function} next Express next middleware
     * 
     * @returns undefined
     */
    viaSpotify: (req, res, next) => {
        // Get JWT token from cookies
        const authToken = req.cookies[config.jwt.cookieName];
        
        if (!authToken) {
            log.debug("AuthChecker.viaSpotify() -> No auth token found");
            const data = {
                status: 401,
                message: "Spotify account not connected"
            };
            return res.send(data);
        }

        // Verify and decode JWT
        const decoded = jwtService.verifyToken(authToken);
        if (!decoded) {
            log.debug("AuthChecker.viaSpotify() -> Invalid or expired token");
            const data = {
                status: 401,
                message: "Invalid or expired token"
            };
            return res.send(data);
        }

        const token = decoded.tokens ? decoded.tokens.access_token : undefined;
        let userId = decoded.user_id;

        log.debug("AuthChecker.viaSpotify() -> JWT decoded", { userId, hasToken: !!token });

        // If we already have user id in the JWT, continue to next handler
        if(userId !== undefined && userId !== null && token !== undefined) {
                log.debug("AuthChecker.viaSpotify() -> User id already in JWT");
                // Add decoded JWT data to request for use in other routes
                req.auth = decoded;
                return next();
        }

        // After logging in, the JWT user id might be undefined or null
        // We will need to ask Spotify for it and update the JWT
        else if((userId === undefined || userId === null) && token !== undefined) {
                log.debug("AuthChecker.viaSpotify() -> Getting Spotify User Id...");
                log.debug("AuthChecker.viaSpotify() -> Token being used:", token);

                user.getUserId(token)
                .then(response => {
                    log.debug("AuthChecker.viaSpotify() -> Retrieved user ID from Spotify:", response);
                    
                    // Create new JWT with user_id
                    const updatedPayload = jwtService.createSessionPayload(decoded.tokens, response, true);
                    const newAuthToken = jwtService.generateToken(updatedPayload);
                    
                    // Update cookie with new JWT
                    res.cookie(config.jwt.cookieName, newAuthToken, {
                        httpOnly: true,
                        maxAge: 60 * 60 * 1000, // 1 hour
                        secure: process.env.NODE_ENV === 'production'
                    });

                    // Add updated JWT data to request
                    req.auth = { ...decoded, user_id: response };
                    log.debug("User id retrieved from Spotify -> " + response);
        
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
            log.debug("AuthChecker.viaSpotify() -> No access_token found in JWT");

            const data = {
                status: 401,
                message: "No valid Spotify token"
            };
            return res.send(data);
        }
    },
};