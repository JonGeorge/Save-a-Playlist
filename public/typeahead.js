const searchInput = document.getElementById("search-input");

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
        console.log(data);
        return data;
    })
    .catch(err => console.error(err));
}

/**
 * Attempt search after a 750 millisecond delay to allow time
 * for typing the full input. If we attempt an additional search
 * before the delay, cancel the timeout and create a new timeout
 * callback to execute the search.
 *
 * @param {string} input Value to search
 */
let delay = 0;
function attemptSearch(input) {
    if(delay) clearTimeout(delay);

    delay = setTimeout(() => {
        search(input)
            .then(response => {
                // console.log(response); // TODO: Handle repsonse with search results
                const playlists = response.playlists.items;
                displayPlaylistResults(playlists);
            })
            .catch(error => {
                console.error(error);
            });
    }, 750);
}



let oldInputValue = "";
searchInput.addEventListener("keyup", (event) => {
    const input = searchInput.value;

    const searchStrNoWhiteSpace = input.replace(/ /g, "").toLowerCase();

    const { minimumCharsForTypeahead } = window.config;
    
    // New input is equivalent to old value
    if(searchStrNoWhiteSpace === oldInputValue) return;
    
    if(searchStrNoWhiteSpace.length >= minimumCharsForTypeahead) {
        attemptSearch(input);
    }

    if (searchStrNoWhiteSpace.length < minimumCharsForTypeahead) {
        clearPlaylistResults();
    }
    
    oldInputValue = searchStrNoWhiteSpace;
});

function displayPlaylistResults(playlists) {
    const ul = document.createElement("ul");

    for(let i = 0; i < playlists.length; i++) {
        const addBtn = getAddBtn(playlists[i]);

        const img = document.createElement("img");
        img.setAttribute("src", playlists[i].images[0].url);
        img.setAttribute("class", "playlist-img");

        const p = document.createElement("p");
        p.setAttribute("class", "playlist-info");
        p.textContent = playlists[i].name;


         const li = document.createElement("li");
         li.appendChild(img);
         li.append(p);
         li.appendChild(addBtn);
         ul.appendChild(li);
    }

    const body = document.getElementById("body");

    const newResultsDiv = document.createElement("div");
    newResultsDiv.setAttribute("id", "search-results");
    newResultsDiv.appendChild(ul); // add list to new results div

    const currentResultsDiv = document.getElementById("search-results");
    const resultsParentDiv  = currentResultsDiv.parentNode;
    resultsParentDiv.replaceChild(newResultsDiv, currentResultsDiv); // replace results div
}

function clearPlaylistResults() {
    const results = document.getElementById("search-results");
    if(results.firstElementChild) {
        results.removeChild(results.firstElementChild);
    }
}

function getAddBtn(playlist) {
    const addBtn = document.createElement("div");
    const addBtnPlus = document.createElement("span");
    addBtnPlus.setAttribute("class", "plus");
    addBtnPlus.innerText = "+\n";

    const addBtnSave = document.createElement("span");
    addBtnSave.setAttribute("class", "save");
    addBtnSave.innerText = "SAVE";

    addBtn.appendChild(addBtnPlus);
    addBtn.appendChild(addBtnSave);
    addBtn.setAttribute("class", "add-btn");

    // const playlistId = playlist.id;
    // const playlistId = playlist.tracks.href;
    
    addBtn.addEventListener("click", event => {
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