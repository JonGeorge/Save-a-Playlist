import { playlistDomUtils } from "./playlistDomUtils";

export const playlistApi = (function() {
    /**
     * Executes a function after a delay. If the
     * returned function is called again before
     * the delay timeout, the timeout is canceled
     * and a new one is created.
     *
     * @param {function} fn Function to call
     * @param {number} delay Milliseconds to wait
     * before executing the function
     *
     * @return {function} Function to clear and set Timeout
     */
    const debounce = function (fn, delay) {
        let timer = 0;

        return function(input, onlyClearTimeout) {
            if(timer) clearTimeout(timer);

            if(onlyClearTimeout) return;

            timer = setTimeout(() => {
                fn(input);
            }, delay);
        };
    };

    /**
     * Converts a one dimensional Javascript object to query string format.
     *
     * @param {object} json Object to be converted.
     * @returns {string} a query string that can be appended to a URL.
     */
    const jsonToQueryStr = function(json) {
        let str = "";

        Object.keys(json).forEach((key, i, arr) => {
            str += `${key}=${json[key]}`;
            str += i !== arr.length-1 ? "&" : "";
        });

        return str;
    };

    /**
     * Executes AJAX api call to fetch search results.
     *
     * @param {string} query passed to Spotify for searching.
     * @returns Promise containing search results in the response.
     */
    const search = function(query) {
        return fetch(`/search?q=${query}&typeahead=true`)
            .then(res => res.json())
            .then(data => {
                // LOG DATA FOR TESTING
                // console.log(data);
                return data;
            })
            .catch(err => console.error(err));
    };

    const searchAndDisplayResults = function(input) {
        search(input)
            .then(response => {
                // console.log(response); // TODO: Handle response with search results
                const playlists = response.playlists.items;
                playlistDomUtils.displayPlaylistResults(playlists);
            })
            .catch(error => {
                console.error(error);
            });
    };

    return {
        addPlaylist: function(playlist, btn) {
            const data = {
                id: playlist.id,
                name: encodeURIComponent(playlist.name),
                tracksUrl: playlist.tracks.href,
                dateTimeStr: new Date().toString(),
                // totalTracks: playlist.tracks.total,
            };

            const dataStr = jsonToQueryStr(data);

            return fetch("/save", {
                "method": "POST",
                "body": dataStr,
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            })
                .then(res => res.json())
                .then(data => data)
                .catch(err => console.error(err));
        },

        debounceSearch: debounce(searchAndDisplayResults, 750),
    };
})();