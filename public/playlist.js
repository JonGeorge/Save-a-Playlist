/* PLAYLIST UTILS */

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
function debounce(fn, delay) {
    let timer = 0;

    return function(input, onlyClearTimeout) {
        if(timer) clearTimeout(timer);

        if(onlyClearTimeout) return;

        timer = setTimeout(() => {
            fn(input);
        }, delay);
    };
}

/**
 * Converts a one dimensional Javascript object to query string format.
 *
 * @param {object} json Object to be converted.
 * @returns {string} a query string that can be appended to a URL.
 */
function jsonToQueryStr(json) {
    let str = "";

    Object.keys(json).forEach((key, i, arr) => {
        str += `${key}=${json[key]}`;
        str += i !== arr.length-1 ? "&" : "";
    });

    return str;
}

/* PLAYLIST ACTIONS */

/**
 * Executes AJAX api call to fetch search results.
 *
 * @param {string} query passed to Spotify for searching.
 * @returns Promise containing search results in the response.
 */
function search(query) {
    return fetch(`/search?q=${query}&typeahead=true`)
        .then(res => res.json())
        .then(data => {
            // LOG DATA FOR TESTING
            // console.log(data);
            return data;
        })
        .catch(err => console.error(err));
}

function addPlaylist(playlist) {
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
        .then(res => res.text())
        .then(data => data)
        .catch(err => console.error(err));
}

/* GENERATE SEARCH RESULTS */

const debounceSearch = debounce(searchAndDisplayResults, 750);
let oldInputValue = "";
function handleSearchEvent(input) {
    const searchStrNoWhiteSpace = input.replace(/ /g, "").toLowerCase();

    const { minimumCharsForTypeahead } = window.config;

    if(searchStrNoWhiteSpace === oldInputValue) {
        return;
    }

    if(searchStrNoWhiteSpace.length >= minimumCharsForTypeahead) {
        debounceSearch(input);
    }

    if (searchStrNoWhiteSpace.length < minimumCharsForTypeahead) {
        debounceSearch(null, true);
        clearPlaylistResults();
    }

    oldInputValue = searchStrNoWhiteSpace;
}

function searchAndDisplayResults(input) {
    search(input)
        .then(response => {
            console.log(response); // TODO: Handle repsonse with search results
            const playlists = response.playlists.items;
            displayPlaylistResults(playlists);
        })
        .catch(error => {
            console.error(error);
        });
}

function clearPlaylistResults() {
    const results = document.getElementById("search-results");
    if(results.firstElementChild) {
        results.removeChild(results.firstElementChild);
    }
}

/* DISPLAY NEW SEARCH RESULTS */

function displayPlaylistResults(playlists) {
    const ul = document.createElement("ul");

    for(let i = 0; i < playlists.length; i++) {
        const image  = getPlaylistImageElement(playlists[i]),
              title  = getPlaylistInfoElement(playlists[i]),
              addBtn = getAddBtn(playlists[i]),
              li     = getResultListElement(image, title, addBtn);

        ul.appendChild(li);
    }
    replaceResultsDiv(ul);
}

function getResultListElement(img, title, button) {
    const li = document.createElement("li");
    li.appendChild(img);
    li.append(title);
    li.appendChild(button);
    return li;
}

function replaceResultsDiv(ul) {
    const newResultsDiv = document.createElement("div");
    newResultsDiv.setAttribute("id", "search-results");
    newResultsDiv.appendChild(ul); // add list to new results div

    const currentResultsDiv = document.getElementById("search-results");
    const resultsParentDiv  = currentResultsDiv.parentNode;
    resultsParentDiv.replaceChild(newResultsDiv, currentResultsDiv);
}

function getPlaylistImageElement(playlist) {
    const a = document.createElement("a");
    a.setAttribute("href", playlist.external_urls.spotify);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noreferrer noopener");

    const img = document.createElement("img");
    img.setAttribute("src", playlist.images[0].url);
    img.setAttribute("class", "playlist-img");

    a.appendChild(img);
    return a;
}

function getPlaylistInfoElement(playlist) {
    const div = document.createElement("div");
    div.setAttribute("class", "playlist-info-container");

    const a = document.createElement("a");
    a.setAttribute("href", playlist.external_urls.spotify);
    a.setAttribute("class", "playlist-info-text");
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noreferrer noopener");
    a.textContent = playlist.name;

    div.appendChild(a);

    return div;
}

function getAddBtn(playlist) {
    const addBtn = document.createElement("div");
    const addBtnPlus = document.createElement("span");
    addBtnPlus.setAttribute("class", "plus");
    addBtnPlus.textContent = "+\n";

    const addBtnSave = document.createElement("span");
    addBtnSave.setAttribute("class", "save");
    addBtnSave.textContent = "SAVE";

    addBtn.appendChild(addBtnPlus);
    addBtn.appendChild(addBtnSave);
    addBtn.setAttribute("class", "add-btn");

    // const playlistId = playlist.id;
    // const playlistId = playlist.tracks.href;
    
    addBtn.addEventListener("click", event => {
        if(!window.config.isLoggedIn) {
            alert("Click the 'Connect to Spotify' button so we can save this playlist.");
            return;
        }

        addPlaylist(playlist)
        .then(response => {
            console.log(response);
        })
        .catch(error => {
            console.error(error);
        });
    });
    return addBtn;
}



