const { Pool }  = require("pg"),
      dbConfig  = require("../config/db"),
      pool      = new Pool(dbConfig),
      session   = require("express-session"),
      pgSession = require("connect-pg-simple")(session);


module.exports = ({
    // Redirect all routes to under construction page
    underConstruction: true,

    // Enable verbose logging
    debug:          process.env.DEBUG,

    // Port this application should listen to and serve requests on
    port:           process.env.PORT || 3000,

    // Protocol used by this application i.e. "http://" or "https://"
    protocol:       process.env.PROTOCOL,

    // Common redirects used in this application
    redirect: {
        onError:        "/error",
        onLoginSuccess: "/success",
    },
    
    // Initializes session config at runtime
    init: function() {
        const sessionConfig = {
            store:             new pgSession({pool}),
            secret:            process.env.COOKIE_SECRET,
            resave:            false,
            saveUninitialized: false,
            cookie: {
                secure:        false,
                httpOnly:      true,
                maxAge:        1000 * 3600
            }
        };

        this.session = session(sessionConfig);
        return this;
    },

    search: {
        // Number of results to return in the playlist search typeahead
        typeAheadReturnCount: 7, // max 50
        // Number of characters required before typeahead search is executed
        minimumCharsForTypeahead: 3
    },
}).init();