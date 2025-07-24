// Database and session dependencies removed for JWT authentication

module.exports = {
    // Redirect all routes to under construction page
    underConstruction: false,

    // Enable verbose logging
    debug: process.env.DEBUG,

    // Port this application should listen to and serve requests on
    port: process.env.PORT || 3000,

    // Protocol used by this application i.e. "http://" or "https://"
    protocol: process.env.PROTOCOL,

    // Common redirects used in this application
    redirect: {
        onError: '/error',
        onLoginSuccess: '/success'
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: '1h',
        cookieName: 'auth_token'
    },

    // Initializes app config at runtime
    init: function () {
        return this;
    },

    search: {
    // Number of results to return in the playlist search typeahead
        typeAheadReturnCount: 7, // max 50
        // Number of characters required before typeahead search is executed
        minimumCharsForTypeahead: 3
    }
}.init();
