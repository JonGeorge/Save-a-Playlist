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

        // Reset login success processing flag for new attempt
        if (window.authPoller && window.authPoller.resetLoginProcessing) {
            window.authPoller.resetLoginProcessing();
        }

        // Store login state globally for the centralized handler to access
        window.loginState = {
            popup: newWindow,
            completed: false,
            pollTimer: null,
            storageListener: null,
            messageListener: null
        };

        // Method 1: Listen for localStorage events (cross-tab communication)
        window.loginState.storageListener = function(e) {
            if (e.key === 'spotify-login-success' && !window.loginState.completed) {
                window.authPoller.handleLoginSuccess('popup-localStorage');
            }
        };
        window.addEventListener('storage', window.loginState.storageListener);

        // Method 2: Listen for PostMessage events as backup for localStorage
        window.loginState.messageListener = function(e) {
            if (e.data && e.data.type === 'spotify-login-success' && !window.loginState.completed) {
                window.authPoller.handleLoginSuccess('popup-postMessage');
            }
        };
        window.addEventListener('message', window.loginState.messageListener);

        // Method 3: Poll window state, name, and localStorage (enhanced detection)
        window.loginState.pollTimer = window.setInterval(function() {
            try {
                // Check if window is closed
                if (newWindow.closed) {
                    window.clearInterval(window.loginState.pollTimer);

                    // Check localStorage for success flag before falling back to server polling
                    const loginSuccess = localStorage.getItem('spotify-login-success');
                    const loginTimestamp = localStorage.getItem('spotify-login-timestamp');
                    const now = Date.now();

                    // If we find a recent login success flag, consider it successful
                    if (loginSuccess && loginTimestamp && (now - parseInt(loginTimestamp)) < 60000) { // Within 1 minute
                        // console.log('Popup closed - found localStorage success flag');
                        window.authPoller.handleLoginSuccess('popup-localStorage-closed');
                        return;
                    }

                    if (!window.loginState.completed) {
                        // Window closed but we didn't detect success - cleanup and start polling server
                        // console.log('Popup closed without login completion, cleaning up oauth_state cookie...');
                        clearOAuthState();
                        // console.log('Starting direct auth polling...');
                        startDirectAuthPolling();
                    }
                    return;
                }

                // Check window name for success flag
                if (newWindow.name === 'spotify-login-success' && !window.loginState.completed) {
                    // console.log('Detected success via window.name');
                    window.authPoller.handleLoginSuccess('popup-windowName');
                }

                // Also check localStorage periodically while popup is open
                const loginSuccess = localStorage.getItem('spotify-login-success');
                if (loginSuccess && !window.loginState.completed) {
                    const timestamp = localStorage.getItem('spotify-login-timestamp');
                    if (timestamp && (Date.now() - parseInt(timestamp)) < 10000) { // Within 10 seconds
                        // console.log('Detected success via localStorage polling');
                        window.authPoller.handleLoginSuccess('popup-localStorage-polling');
                    }
                }
            }
            catch(e) {
                // Intentionally ignore cross-origin errors
            }
        }, 500); // Reduced frequency to 500ms for better detection

        // Clean up OAuth state cookie when login is abandoned
        function clearOAuthState() {
            // Call server endpoint to clear the HttpOnly oauth_state cookie
            fetch('/api/clearOAuthState', {
                method: 'POST',
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                // console.log('OAuth state cleared:', data.message);
            })
            .catch(error => {
                // console.warn('Failed to clear OAuth state:', error);
                // Cookie will still expire after 5 minutes
            });
        }

        // Direct polling fallback when popup closes without detection
        function startDirectAuthPolling() {
            // console.log('Starting direct auth polling as fallback...');
            // Delegate to the centralized polling mechanism
            window.authPoller.start();
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
