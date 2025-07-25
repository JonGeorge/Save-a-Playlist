const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1h'; // Match current session timeout

module.exports = {
    // Generate JWT token with user session data
    generateToken: (payload) => {
        return jwt.sign(payload, JWT_SECRET, { 
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'save-a-playlist'
        });
    },

    // Verify and decode JWT token
    verifyToken: (token) => {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    },

    // Create session-like payload from auth data
    createSessionPayload: (tokens, userId, isLoggedIn = true) => {
        return {
            tokens,
            user_id: userId,
            isLoggedIn,
            timestamp: Date.now()
        };
    },

    // Create state token for OAuth flow
    createStateToken: (state) => {
        return jwt.sign({ state, type: 'oauth_state' }, JWT_SECRET, { 
            expiresIn: '10m' // Shorter expiry for OAuth state
        });
    },

    // Verify state token
    verifyStateToken: (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded.type === 'oauth_state' ? decoded.state : null;
        } catch (error) {
            return null;
        }
    }
};
