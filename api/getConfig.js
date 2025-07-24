const log = require('../services/log');
const frontendConfig = require('../config/frontend');
const jwtService = require('../services/jwt');
const config = require('../config/app');
const { parseCookies } = require('../services/utils');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const cookies = parseCookies(req);

        // Make a copy of our JS object so we don't mutate the original config
        const responseConfig = { ...frontendConfig };

        // Check for JWT token instead of session
        const token = cookies[config.jwt.cookieName];
        responseConfig.isLoggedIn = false;
        
        if (token) {
            const decoded = jwtService.verifyToken(token);
            responseConfig.isLoggedIn = !!(decoded && decoded.tokens && decoded.tokens.access_token);
        }

        res.json(responseConfig);
    } catch (error) {
        log.error('Error in getConfig:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
