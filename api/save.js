const log = require('../services/log');
const playlist = require('../services/playlist');
const user = require('../services/user');
const { auth, sanitize, middleware } = require('../security');
const config = require('../config/app');
const { getFormattedDateStr, parseCookies, parseRequestBody } = require('../services/utils');


/**
 * Updates JWT cookie with new user ID
 */
async function updateJwtWithUserId(res, decoded, token) {
    const userId = await user.getUserId(token);

    const updatedPayload = auth.jwt.createSessionPayload(decoded.tokens, userId, true);
    const newAuthToken = auth.jwt.generateToken(updatedPayload);

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
    
    // Validate and sanitize playlist name
    const nameResult = sanitize.process.playlistName(decodeURIComponent(name || ''), {
        maxLength: 100,
        allowEmpty: false
    });
    
    if (!nameResult.isValid) {
        throw new Error(`Invalid playlist name: ${nameResult.errors.join(', ')}`);
    }
    
    // Validate and sanitize tracks URL
    const urlResult = sanitize.process.url(tracksUrl || '', {
        requireSpotify: true,
        allowEmpty: false
    });
    
    if (!urlResult.isValid) {
        throw new Error(`Invalid tracks URL: ${urlResult.errors.join(', ')}`);
    }
    
    const date = getFormattedDateStr(dateTimeStr);
    const sanitizedPlaylistName = nameResult.sanitized;
    const sanitizedTracksUrl = urlResult.sanitized;

    return {
        name: `${sanitizedPlaylistName} - Saved on ${date}`,
        description: `This playlist was copied from "${sanitizedPlaylistName}" on ${date}.`,
        public: false,
        tracks: sanitizedTracksUrl
    };
}

/**
 * Creates a copy of a Spotify playlist for the authenticated user
 */
module.exports = async (req, res) => {
    return middleware.api.save(req, res, async () => {
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
            const decoded = auth.jwt.verifyToken(authToken);
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

            // Create the playlist with sanitized data
            log.debug('Creating playlist:', { originalName: body.name, userId });

            const playlistDetails = createPlaylistDetails(body);
            log.debug('Sanitized playlist details:', { 
                name: playlistDetails.name, 
                tracks: playlistDetails.tracks 
            });
            
            const response = await playlist.createPlaylistFromTracks(userId, decoded.tokens, playlistDetails);

            // Return success or failure response
            if (response.ok) {
                res.json({ status: 200, message: 'Playlist successfully saved.' });
            } else {
                res.json({ status: 500, message: 'Something is wrong. Spotify could not save the playlist.' });
            }

        }
        catch (error) {
            // Handle validation errors specifically
            if (error.message.includes('Invalid playlist name') || error.message.includes('Invalid tracks URL')) {
                log.debug('Save validation error:', error.message);
                return res.status(400).json({ status: 400, message: error.message });
            }
            
            log.error('Error in save endpoint:', error.message);
            log.error('Stack trace:', error.stack);
            res.status(500).json({ status: 500, message: `Internal server error: ${error.message}` });
        }
    });
};
