const playlistDomUtils = (function() {

    let oldPlaylistSearchValue = '';

    const clearPlaylistResults = function() {
        const results = document.getElementById('search-results');
        if(results.firstElementChild) {
            results.removeChild(results.firstElementChild);
        }
    };

    const getResultListElement = function(img, title, button) {
        const li = document.createElement('li');
        li.appendChild(img);
        li.append(title);
        li.appendChild(button);
        return li;
    };

    const replaceResultsDiv = function(ul) {
        const newResultsDiv = document.createElement('div');
        newResultsDiv.setAttribute('id', 'search-results');
        newResultsDiv.appendChild(ul); // add list to new results div

        const currentResultsDiv = document.getElementById('search-results');
        const resultsParentDiv  = currentResultsDiv.parentNode;
        resultsParentDiv.replaceChild(newResultsDiv, currentResultsDiv);
    };

    const getPlaylistImageElement = function(playlist) {
        const a = document.createElement('a');
        a.setAttribute('href', playlist.external_urls.spotify);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noreferrer noopener');

        const img = document.createElement('img');
        img.setAttribute('src', playlist.images[0].url);
        img.setAttribute('class', 'playlist-img');

        a.appendChild(img);
        return a;
    };

    const getPlaylistInfoElement = function(playlist) {
        const div = document.createElement('div');
        div.setAttribute('class', 'playlist-info-container');

        const a = document.createElement('a');
        a.setAttribute('href', playlist.external_urls.spotify);
        a.setAttribute('class', 'playlist-info-text');
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noreferrer noopener');
        a.textContent = playlist.name;

        div.appendChild(a);

        return div;
    };

    const displaySaveFailedMessage = function(btnToReplace, btnToShowAfterFailedMessage) {
        const errorBtn = document.createElement('div');

        const errorBtnIcon = document.createElement('img');
        errorBtnIcon.setAttribute('src', './resources/alert-circle-outline-red.svg');
        errorBtnIcon.setAttribute('class', 'error-btn-icon');

        const errorBtnText = document.createElement('span');
        errorBtnText.setAttribute('class', 'error-btn-text');
        errorBtnText.textContent = 'Oops!\r\nPlease connect to spotify.\r\nThen try again.';

        errorBtn.appendChild(errorBtnIcon);
        errorBtn.appendChild(errorBtnText);
        errorBtn.setAttribute('class', 'error-btn');

        const parent = btnToReplace.parentNode;
        parent.replaceChild(errorBtn, btnToReplace);

        // display error message for 6 seconds then replace error message with something else
        setTimeout(function(){
            if(btnToShowAfterFailedMessage)
            {parent.replaceChild(btnToShowAfterFailedMessage, errorBtn);}
            else
            {parent.replaceChild(btnToReplace, errorBtn);}
        }, 6000);
    };

    const displaySaveSuccessfulMessage = function(btn) {
        const successBtn = document.createElement('div');

        const successBtnIcon = document.createElement('img');
        successBtnIcon.setAttribute('src', './resources/check-mark-green.svg');
        successBtnIcon.setAttribute('class', 'error-btn-icon');

        const successBtnText = document.createElement('span');
        successBtnText.setAttribute('class', 'save-btn-text');
        successBtnText.textContent = 'Saved';

        successBtn.appendChild(successBtnIcon);
        successBtn.appendChild(successBtnText);
        successBtn.setAttribute('class', 'success-btn');

        const parent = btn.parentNode;
        parent.replaceChild(successBtn, btn);
    };

    const showLoadingIcon = function (btn) {
        const i = document.createElement('i');
        i.setAttribute('class', 'fa fa-spinner fa-spin');

        const loadingDiv = document.createElement('div');
        loadingDiv.appendChild(i);
        loadingDiv.setAttribute('class', 'loading');

        const parent = btn.parentNode;
        parent.replaceChild(loadingDiv, btn);

        return loadingDiv;
    };

    const getAddBtn = function(playlist) {
        const addBtn = document.createElement('div');
        const addBtnPlus = document.createElement('span');
        addBtnPlus.setAttribute('class', 'save-btn-icon');
        addBtnPlus.textContent = '+\n';

        const addBtnSave = document.createElement('span');
        addBtnSave.setAttribute('class', 'save-btn-text');
        addBtnSave.textContent = 'SAVE';

        addBtn.appendChild(addBtnPlus);
        addBtn.appendChild(addBtnSave);
        addBtn.setAttribute('class', 'add-btn');

        // const playlistId = playlist.id;
        // const playlistId = playlist.tracks.href;

        addBtn.addEventListener('click', event => {
            if(!window.config.isLoggedIn) {
                // alert("Click the 'Connect to Spotify' button so we can save this playlist.");
                displaySaveFailedMessage(addBtn);
                return;
            }

            const loadingDiv = showLoadingIcon(addBtn);

            playlistApi.addPlaylist(playlist, addBtn)
                .then(response => {
                    // if status in the 200s then display success message
                    if(response.status >= 200 && response.status < 300) {
                        displaySaveSuccessfulMessage(loadingDiv);
                    }
                    else { // Otherwise display error message
                        displaySaveFailedMessage(loadingDiv, addBtn);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        });
        return addBtn;
    };

    return {
        handleSearchEvent: function(input) {
            const searchStrNoWhiteSpace = input.replace(/ /g, '').toLowerCase();

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
            const ul = document.createElement('ul');

            for(let i = 0; i < playlists.length; i++) {
                const image  = getPlaylistImageElement(playlists[i]),
                    title  = getPlaylistInfoElement(playlists[i]),
                    addBtn = getAddBtn(playlists[i]),
                    li     = getResultListElement(image, title, addBtn);

                ul.appendChild(li);
            }
            replaceResultsDiv(ul);
        }
    };
})();
