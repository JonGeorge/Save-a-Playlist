const log = require('../services/log');
const playlist = require('../services/playlist');
const user = require('../services/user');
const jwtService = require('../services/jwt');
const config = require('../config/app');
const { getFormattedDateStr, parseCookies, parseRequestBody } = require('../services/utils');


/**
 * Updates JWT cookie with new user ID
 */
async function updateJwtWithUserId(res, decoded, token) {
    const userId = await user.getUserId(token);

    const updatedPayload = jwtService.createSessionPayload(decoded.tokens, userId, true);
    const newAuthToken = jwtService.generateToken(updatedPayload);

    const cookieOptions = [
        `${config.jwt.cookieName}=${newAuthToken}`,
        'HttpOnly',
        'Max-Age=3600', // 1 hour
        'Path=/',
        process.env.NODE_ENV === 'production' ? 'Secure' : '',
        'SameSite=Lax'
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieOptions);
    return userId;
}

/**
 * Creates playlist details object with formatted name and description
 */
function createPlaylistDetails(body) {
    const { tracksUrl, name, dateTimeStr } = body;
    const date = getFormattedDateStr(dateTimeStr);
    const playlistName = decodeURIComponent(name);

    return {
        name: `${playlistName} - Saved on ${date}`,
        description: `This playlist was copied from "${playlistName}" on ${date}.`,
        public: false,
        tracks: tracksUrl
    };
}

/**
 * Creates a copy of a Spotify playlist for the authenticated user
 */
module.exports = async (req, res) => {
    log.debug('Save API:', req.method);

    // Validate HTTP method
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 405, message: 'Method not allowed' });
    }

    try {
        // Parse request data
        const cookies = parseCookies(req);
        const body = parseRequestBody(req.body);

        // Extract and validate auth token
        const authToken = cookies[config.jwt.cookieName];
        if (!authToken) {
            return res.status(401).json({ status: 401, message: 'Spotify account not connected' });
        }

        // Verify JWT token
        const decoded = jwtService.verifyToken(authToken);
        if (!decoded) {
            return res.status(401).json({ status: 401, message: 'Invalid or expired token' });
        }

        // Extract user credentials
        const token = decoded.tokens?.access_token;
        let userId = decoded.user_id;

        // Fetch missing user ID from Spotify and update JWT
        if (!userId && token) {
            log.debug('Fetching Spotify user ID for JWT update');
            try {
                userId = await updateJwtWithUserId(res, decoded, token);
            }
            catch (err) {
                log.error('Could not get Spotify user id:', err);
                return res.status(403).json({ status: 403, message: 'Could not get user id' });
            }
        }

        // Final validation
        if (!token || !userId) {
            return res.status(401).json({ status: 401, message: 'No valid Spotify token' });
        }

        // Create the playlist
        log.debug('Creating playlist:', { name: decodeURIComponent(body.name), userId });

        const playlistDetails = createPlaylistDetails(body);
        const response = await playlist.createPlaylistFromTracks(userId, decoded.tokens, playlistDetails);

        // Return success or failure response
        if (response.ok) {
            res.json({ status: 200, message: 'Playlist successfully saved.' });
        } else {
            res.json({ status: 500, message: 'Something is wrong. Spotify could not save the playlist.' });
        }

    }
    catch (error) {
        log.error('Error in save endpoint:', error.message);
        log.error('Stack trace:', error.stack);
        res.status(500).json({ status: 500, message: `Internal server error: ${error.message}` });
    }
};
