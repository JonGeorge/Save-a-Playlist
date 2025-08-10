const log = require('../services/log');
const frontendConfig = require('../config/frontend');
const { auth, middleware } = require('../security');
const config = require('../config/app');
const { parseCookies } = require('../services/utils');

module.exports = async (req, res) => {
    return middleware.api.config(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const cookies = parseCookies(req);
            // console.log('getConfig - cookies:', Object.keys(cookies));
            // console.log('getConfig - looking for cookie:', config.jwt.cookieName);

            // Make a copy of our JS object so we don't mutate the original config
            const responseConfig = { ...frontendConfig };

            // Check for JWT token instead of session
            const token = cookies[config.jwt.cookieName];
            // console.log('getConfig - token exists:', !!token);
            responseConfig.isLoggedIn = false;

            if (token) {
                // console.log('getConfig - verifying token...');
                const decoded = auth.jwt.verifyToken(token);
                // console.log('getConfig - decoded token valid:', !!(decoded && decoded.tokens && decoded.tokens.access_token));
                responseConfig.isLoggedIn = !!(decoded && decoded.tokens && decoded.tokens.access_token);
            }

            // console.log('getConfig - returning isLoggedIn:', responseConfig.isLoggedIn);
            res.json(responseConfig);
        } catch (error) {
            log.error('Error in getConfig:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};
