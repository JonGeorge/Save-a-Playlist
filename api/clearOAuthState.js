const { middleware } = require('../security');

/**
 * Clears the oauth_state cookie when user abandons login flow
 * This is called when the popup window closes without completing authentication
 */
module.exports = async (req, res) => {
    return middleware.api.config(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            // Clear the oauth_state cookie by setting it to expire immediately
            res.setHeader('Set-Cookie', 'oauth_state=; HttpOnly; Max-Age=0; Path=/');
            
            res.json({ success: true, message: 'OAuth state cleared' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to clear OAuth state' });
        }
    });
};