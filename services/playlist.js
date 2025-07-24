const log = require('./log');
const spotifyDao = require('../dao/spotify');
const spotify = require('../config/spotify');
const { jsonToQueryStr } = require('./utils');

const PlaylistService = {

    republishPlaylist: function() {

    },

    /**
     * Creates a new playlist in the current user's Spotify account, and adds
     * tracks to the new playlist from another playlist's tracks url specified
     * in the details object.
     * 
     * @param {string} user Spotify user id of user for whom we want to create
     *                      a playlist
     * @param {object} tokens Object containing access and refresh tokens
     * @param {object} details Object containing playlist name, description,
     *                         tracks url, and public boolean flag
     */
    createPlaylistFromTracks: function(user, tokens, details) {
        const { name, description, public: isPublic, tracks } = details;

        const items = [];

        return createEmptyPlaylist(name, description, isPublic, user, tokens)
            .then(newPlaylistId => {
                return getItemsFromExistingPlaylist(tracks, true, items, tokens)
                    .then(list => {
                        return { list, newPlaylistId };
                    })
                    .catch(err => log.debug(err));
            })
            .then(pkg => {
                log.debug('Number of track uris retrieved', (pkg.list.length));

                return addItemsToPlaylist(pkg.list, pkg.newPlaylistId, tokens);
            })
            .catch(err => log.debug(err));
    }
};

/**
 * Creates an empty playlist in the user's Spotify account. 
 * Tracks are added to this playlist later.
 * 
 * @param {string} name Name of the playlist to be created.
 * @param {string} description Description of the playlist added to Spotify
 * @param {boolean} isPublic If true, the created playlist will be public
 * @param {string} user Spotify user id of the user to which the new playlist belongs
 * @param {object} tokens Object containing access and refresh tokens
 * 
 * @returns Promise containing the id of the newly created playlist
 */
function createEmptyPlaylist(name, description, isPublic, user, tokens) {

    const data = {
        'name': name,
        'public': isPublic,
        'description': description || spotify.playlist.defaultDescription // Add validation on description - i.e. no " "
    };

    const url = `https://api.spotify.com/v1/users/${user}/playlists`;
    const options = spotifyDao.getJsonRequestOptions('post', url, tokens.access_token, data);

    log.debug('Playlist.createEmptyPlaylist() -> Creating playlist: ' + name);
    return spotifyDao.request(options, tokens.refresh_token)
        .then(newPlaylist => {
            log.debug('Playlist.createEmptyPlaylist() -> Successfully created playlist');
            // log.debug("Playlist created response ->", response);

            return newPlaylist.id;
        // Need to return the response
        })
        .catch(err => log.error('Playlist service error:', err));
}

/**
 * Adds items (tracks, podcasts, videos, etc.) to a playlist. Spotify requires
 * items to be added, at most, 100 at a time. If we have more that 100 items in
 * the items array, we recurisively call this method for each set of 100, 
 * making an htttp request for each method call.
 * 
 * @param {array} items Array of string uris for each item to add to the playlist
 * @param {string} playlist Id of playlist to which items are added
 * @param {object} tokens Spotify access_token and refresh_token
 * @param {number} offset Offest times the max number of items is the start index
 */
function addItemsToPlaylist(items, playlist, tokens, offset = 0) {
    const limit = 100;
    const start = offset * limit;
    let end = start + limit;

    if(end > items.length) {
        end = start + (items.length % limit); // should be the same as end = items.length
    }

    log.debug(`Playlist.addItemsToPlaylist() -> Adding tracks ${start + 1} - ${end}`);
    // log.debug(`Playlist.addItemsToPlaylist() -> Offset: ${offset}, No. of Items: ${items.length}`);

    const itemsToAdd = items.slice(start, end);
    
    const data = { 'uris': itemsToAdd };

    const url = `https://api.spotify.com/v1/playlists/${playlist}/tracks`;

    const options = spotifyDao.getJsonRequestOptions('post', url, tokens.access_token, data);

    return spotifyDao.request(options, tokens.refresh_token)
        .then(response => {
        
            if(end === items.length) {
                log.debug('Playlist.addItemsToPlaylist() -> ' + 
                      'Successfully added ' + end + ' items to playlist');
                return { ok: true };
            }
            else {return addItemsToPlaylist(items, playlist, tokens.access_token, ++offset);}

        })
        .catch(err => log.error('Playlist service error:', err));
}

/**
 * Get track URIs and add the URIs to the 'items' array.
 * This method is called recursively when the 'next'
 * response parameter is not null. On the first call of
 * this method, isFirst should be set to true. This will
 * append the url with the appropriate parameters for
 * requesting the track URIs.
 * 
 * @param {string} url URL of playlist tracks
 * @param {boolean} isFirst if true, url parameters will be appended to the url
 * @param {array} items array to store retrieved items
 * @param {object} tokens Access and refresh tokens object
 */
function getItemsFromExistingPlaylist(url, isFirst, items, tokens) {
    if(isFirst) {
        const params = {
            fields: 'next,items(track(uri))',
            limit: 100,
            offset: 0
        };

        url = `${url}?${jsonToQueryStr(params)}`;
    }

    const options = spotifyDao.getJsonRequestOptions('get', url, tokens.access_token);

    log.debug(`Playlist.getItemsFromExistingPlaylist() -> Getting items from playlist ${url}`);
    return spotifyDao.request(options, tokens.refresh_token)
        .then(response => {

            response.items.forEach(item => {
                items.push(item.track.uri);
            });

            if(response.next) {
                return getItemsFromExistingPlaylist(response.next, false, items, tokens.access_token)
                    .then(() => {
                        return items;
                    })
                    .catch(err => log.error('Playlist service error:', err));
            }

            log.debug('Playlist.getItemsFromExistingPlaylist() -> ' + 
                  'Successfully retrieved all items.');

            return items;
        })
        .catch(err => log.error('Playlist service error:', err));
}

module.exports = PlaylistService;
