const playlistDomUtils = function() {

    let oldPlaylistSearchValue = "";

    const clearPlaylistResults = function() {
        const results = document.getElementById("search-results");
        if(results.firstElementChild) {
            results.removeChild(results.firstElementChild);
        }
    };

    const getResultListElement = function(img, title, button) {
        const li = document.createElement("li");
        li.appendChild(img);
        li.append(title);
        li.appendChild(button);
        return li;
    };

    const replaceResultsDiv = function(ul) {
        const newResultsDiv = document.createElement("div");
        newResultsDiv.setAttribute("id", "search-results");
        newResultsDiv.appendChild(ul); // add list to new results div

        const currentResultsDiv = document.getElementById("search-results");
        const resultsParentDiv  = currentResultsDiv.parentNode;
        resultsParentDiv.replaceChild(newResultsDiv, currentResultsDiv);
    };

    const getPlaylistImageElement = function(playlist) {
        const a = document.createElement("a");
        a.setAttribute("href", playlist.external_urls.spotify);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noreferrer noopener");

        const img = document.createElement("img");
        img.setAttribute("src", playlist.images[0].url);
        img.setAttribute("class", "playlist-img");

        a.appendChild(img);
        return a;
    };

    const getPlaylistInfoElement = function(playlist) {
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
    };

    const getAddBtn = function(playlist) {
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

            playlistApi.addPlaylist(playlist)
                .then(response => {
                    // console.log(response);
                })
                .catch(error => {
                    console.error(error);
                });
        });
        return addBtn;
    };

    return {
        handleSearchEvent: function(input) {
            const searchStrNoWhiteSpace = input.replace(/ /g, "").toLowerCase();

            const { minimumCharsForTypeahead } = window.config;

            if(searchStrNoWhiteSpace === oldPlaylistSearchValue) {
                return;
            }

            if(searchStrNoWhiteSpace.length >= minimumCharsForTypeahead) {
                playlistApi.debounceSearch(input);
            }

            if (searchStrNoWhiteSpace.length < minimumCharsForTypeahead) {
                playlistApi.debounceSearch(null, true);
                clearPlaylistResults();
            }

            oldPlaylistSearchValue = searchStrNoWhiteSpace;
        },

        displayPlaylistResults: function(playlists) {
            const ul = document.createElement("ul");

            for(let i = 0; i < playlists.length; i++) {
                const image  = getPlaylistImageElement(playlists[i]),
                      title  = getPlaylistInfoElement(playlists[i]),
                      addBtn = getAddBtn(playlists[i]),
                      li     = getResultListElement(image, title, addBtn);

                ul.appendChild(li);
            }
            replaceResultsDiv(ul);
        },
    };
}();