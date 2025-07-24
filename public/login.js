(function displayConnectToSpotifyButton() {

    const getCheckIcon = function() {
        const checkIcon = document.createElement('img');
        checkIcon.setAttribute('src', './resources/check-mark-green.svg');
        checkIcon.setAttribute('class', 'checkmark');

        return checkIcon;
    };

    const getSpan = function(txt) {
        const span= document.createElement('span');
        span.textContent = txt;

        return span;
    };

    const getConnectToSpotifyBtn = function() {
        const strong       = document.createElement('strong');
        strong.textContent = 'Connect to Spotify';

        const a = document.createElement('a');
        a.setAttribute('id', 'login');
        a.appendChild(strong);

        a.addEventListener('click', event => {
            openLoginWindow('/login');
        });

        return a;
    };

    const getConnectedStatusElement = function(element1, element2) {
        const div = document.createElement('div');
        div.setAttribute('class', 'connected-text');
        div.appendChild(element1);
        div.appendChild(element2);

        return div;
    };

    const openLoginWindow = function(url) {
        const newWindow = window.open(url, 'Spotify Login', 'toolbar=no, menubar=no, status=no, directories=no, height=750, width=600');
        if(window.focus) {
            newWindow.focus();
        }

        // Check for "/success" in the newWindow URL and close the window if found
        const pollTimer = window.setInterval(function() {
            try {
                if(newWindow.document.URL.indexOf('/success') !== -1) {
                    window.clearInterval(pollTimer);

                    window.config.isLoggedIn = true;
                    displayConnectToSpotifyButton();

                    // var url =   newWindow.document.URL;
                    newWindow.close();
                }
            }
            catch(e) {
                // Intentionally ignore errors when checking login window
            }
        }, 100);
    };

    if(window.config) { // Check if appConfig is loaded
        if(window.config.isLoggedIn) {
            const checkIcon             = getCheckIcon(),
                span                  = getSpan('Connected to Spotify'),
                connectedToSpotifyDiv = getConnectedStatusElement(checkIcon, span);

            // If 'Connect to Spotify' button is on the page,
            // replace Connect button with text that says user
            // is already connected
            const connectToSpotifyBtn = document.getElementById('login');
            if(connectToSpotifyBtn) {
                const parent = connectToSpotifyBtn.parentNode;
                parent.replaceChild(connectedToSpotifyDiv, connectToSpotifyBtn);
            }

            // Connect to Spotify button is not on the page.
            // Append the right side header.
            else {
                const rightHeader = document.getElementsByClassName('right-header')[0];
                rightHeader.appendChild(connectedToSpotifyDiv);
            }
        }
        // Current session is not logged in
        else {
            const rightHeader = document.getElementsByClassName('right-header')[0];
            rightHeader.appendChild(getConnectToSpotifyBtn());
        }
    }
    else { // Config hasn't loaded yet, try again
        setTimeout(displayConnectToSpotifyButton, 50);
    }
})();
