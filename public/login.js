function displayConnectToSpotifyButton() {

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

        // Multiple methods to detect successful login
        let loginCompleted = false;

        // Method 1: Listen for localStorage events (cross-tab communication)
        const storageListener = function(e) {
            if (e.key === 'spotify-login-success' && !loginCompleted) {
                loginCompleted = true;
                handleLoginSuccess();
            }
        };
        window.addEventListener('storage', storageListener);

        // Method 2: Provide a callback function for the popup (now global)
        if (!window.spotifyLoginSuccess) {
            window.spotifyLoginSuccess = function() {
                if (!loginCompleted) {
                    loginCompleted = true;
                    handleLoginSuccess();
                }
            };
        }

        // Method 3: Poll window state and name (fallback)
        const pollTimer = window.setInterval(function() {
            try {
                if (newWindow.closed) {
                    window.clearInterval(pollTimer);
                    window.removeEventListener('storage', storageListener);

                    if (!loginCompleted) {
                        // Window closed but we didn't detect success - start polling server
                        console.log('Popup closed, starting direct auth polling...');
                        startDirectAuthPolling();
                    }
                    return;
                }

                // Check window name for success flag
                if (newWindow.name === 'spotify-login-success' && !loginCompleted) {
                    loginCompleted = true;
                    handleLoginSuccess();
                }
            }
            catch(e) {
                // Intentionally ignore cross-origin errors
            }
        }, 100);

        // Direct polling fallback when popup closes without detection
        function startDirectAuthPolling() {
            let pollCount = 0;
            const maxPolls = 20; // Poll for 10 seconds

            function pollAuthStatus() {
                fetch('/api/getConfig')
                    .then(response => response.json())
                    .then(config => {
                        window.config = config;
                        if (config.isLoggedIn && !loginCompleted) {
                            loginCompleted = true;
                            console.log('Login detected via direct polling');
                            // Reset auth cache timestamp since we just got fresh data
                            window.authStateTimestamp = Date.now();
                            displayConnectToSpotifyButton();
                            return;
                        }

                        pollCount++;
                        if (pollCount < maxPolls) {
                            setTimeout(pollAuthStatus, 500);
                        }
                    })
                    .catch(error => {
                        console.error('Auth polling failed:', error);
                        pollCount++;
                        if (pollCount < maxPolls) {
                            setTimeout(pollAuthStatus, 500);
                        }
                    });
            }

            // Start polling after a brief delay
            setTimeout(pollAuthStatus, 500);
        }

        function handleLoginSuccess() {
            window.clearInterval(pollTimer);
            window.removeEventListener('storage', storageListener);
            // Don't delete global callback, other popups might need it

            if (newWindow && !newWindow.closed) {
                newWindow.close();
            }

            // Signal successful login to other parts of the app
            localStorage.setItem('spotify-login-success', Date.now().toString());
            // localStorage.removeItem('spotify-login-success');

            // Refresh auth state from server
            refreshAuthState();
        }

        function refreshAuthState() {
            // Fetch updated config from server
            fetch('/api/getConfig')
                .then(response => response.json())
                .then(config => {
                    window.config = config;
                    window.authStateTimestamp = Date.now();
                    displayConnectToSpotifyButton();
                })
                .catch(error => {
                    console.error('Error refreshing auth state:', error);
                    // Fallback: just update local state and refresh UI
                    window.config.isLoggedIn = true;
                    window.authStateTimestamp = Date.now();
                    displayConnectToSpotifyButton();
                });
        }
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
            // Check if Connect to Spotify button already exists
            const existingBtn = document.getElementById('login');
            if (!existingBtn) {
                const rightHeader = document.getElementsByClassName('right-header')[0];
                rightHeader.appendChild(getConnectToSpotifyBtn());
            }
            else {
              const connectToSpotifyBtn = document.getElementById('login');
              const parent = connectToSpotifyBtn.parentNode;
              parent.replaceChild(getConnectToSpotifyBtn(), connectToSpotifyBtn);
            }
        }
    }
    else { // Config hasn't loaded yet, try again
        setTimeout(displayConnectToSpotifyButton, 50);
    }
}

// Make the function globally accessible
window.displayConnectToSpotifyButton = displayConnectToSpotifyButton;

// Call it initially
displayConnectToSpotifyButton();
