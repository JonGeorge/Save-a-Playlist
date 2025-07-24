const spotify = require('../config/spotify');
const spotifyDao = require('../dao/spotify');
const log = require('./log');

// May be a good idea to get any profile info one time
// set session variables to the profile info we need

module.exports = {
    getUserId: (token) => {
        const options = {
            'url': spotify.profile.url,
            'method': 'get',
            'headers': {
                'Authorization' : 'Bearer ' + token
            }
        };

        return spotifyDao.request(options)
            .then(response => response.id)
            .catch(err => log.debug(err));
    }
};
