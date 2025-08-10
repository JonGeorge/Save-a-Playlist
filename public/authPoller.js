(function() {
    'use strict';

    let pollTimer = null;
    let pollCount = 0;
    let isPolling = false;
    let loginSuccessProcessed = false;

    // Performance-optimized polling intervals
    const INITIAL_INTERVAL = 2000; // 2 seconds for first 30 seconds
    const EXTENDED_INTERVAL = 30000; // 30 seconds thereafter
    const MAX_INITIAL_POLLS = 15; // 30 seconds worth of 2-second polls

    /**
     * Fetches current auth status from server with caching
     */
    function checkAuthStatus() {
        const now = Date.now();
        const cacheAge = 30 * 60 * 1000; // 30 minutes in milliseconds

        // Check if we have recent cached auth state
        if (window.config && window.authStateTimestamp && (now - window.authStateTimestamp) < cacheAge) {
            // console.log('Using cached auth state, age:', Math.round((now - window.authStateTimestamp) / 1000), 'seconds');
            return Promise.resolve(window.config.isLoggedIn);
        }

        // console.log('Auth cache expired or missing, fetching from server');
        return fetch('/api/getConfig')
            .then(response => response.json())
            .then(config => {
                window.config = config;
                window.authStateTimestamp = now;
                return config.isLoggedIn;
            })
            .catch(error => {
                console.error('Auth status check failed:', error);
                return null;
            });
    }

    /**
     * Updates UI based on current auth status
     */
    function updateUI() {

        // Trigger the existing login display function
        if (typeof displayConnectToSpotifyButton === 'function') {
            try {
                displayConnectToSpotifyButton();
                // console.log('displayConnectToSpotifyButton() called successfully');
            } catch (error) {
                console.error('Error calling displayConnectToSpotifyButton:', error);
            }
        } else {
            // console.warn('displayConnectToSpotifyButton function not available, trying fallback...');

            // Fallback: wait a bit and try again, or dispatch custom event
            setTimeout(() => {
                if (typeof displayConnectToSpotifyButton === 'function') {
                    displayConnectToSpotifyButton();
                } else {
                    // Create custom event as last resort
                    const event = new CustomEvent('authStatusChanged', {
                        detail: { isLoggedIn: window.config?.isLoggedIn || false }
                    });
                    window.dispatchEvent(event);
                }
            }, 100);
        }
    }

    /**
     * Starts polling for auth status changes
     */
    function startAuthPolling() {
        if (isPolling) return;

        isPolling = true;
        pollCount = 0;

        function poll() {
            // console.log(`Auth polling attempt ${pollCount + 1}...`);
            checkAuthStatus().then(isLoggedIn => {
                // console.log('Poll result - isLoggedIn:', isLoggedIn);
                if (isLoggedIn === true) {
                    // User is now logged in - update UI and stop polling
                    // console.log('Polling detected login success, updating UI...');
                    handleLoginSuccess('polling-detection');
                    stopAuthPolling();
                    return;
                }

                if (isLoggedIn === null) {
                    // Error occurred - stop polling to avoid spam
                    // console.log('Polling error, stopping...');
                    stopAuthPolling();
                    return;
                }

                // Continue polling with appropriate interval
                pollCount++;
                const interval = pollCount < MAX_INITIAL_POLLS ? INITIAL_INTERVAL : EXTENDED_INTERVAL;
                // console.log(`Continuing polling, next check in ${interval}ms`);

                pollTimer = setTimeout(poll, interval);
            });
        }

        // Start immediately
        poll();
    }

    /**
     * Stops auth polling
     */
    function stopAuthPolling() {
        if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = null;
        }
        isPolling = false;
        pollCount = 0;
    }

    /**
     * Centralized login success handler - handles all auth state changes
     * Can be called from popup windows, storage events, or direct calls
     */
    function handleLoginSuccess(context = 'unknown') {
        if (loginSuccessProcessed) {
            return;
        }
        loginSuccessProcessed = true;

        // console.log('Login success detected from:', context);

        // Stop any existing polling
        stopAuthPolling();

        // Reset auth cache timestamp to force fresh check
        window.authStateTimestamp = 0;

        // Clean up any login-related popup state
        if (window.loginState) {
            // Close popup if it's still open
            if (window.loginState.popup && !window.loginState.popup.closed) {
                window.loginState.popup.close();
            }

            // Clear popup-specific event listeners
            if (window.loginState.storageListener) {
                window.removeEventListener('storage', window.loginState.storageListener);
            }
            if (window.loginState.messageListener) {
                window.removeEventListener('message', window.loginState.messageListener);
            }
            if (window.loginState.pollTimer) {
                clearInterval(window.loginState.pollTimer);
            }

            // Mark login as completed to prevent duplicate handling
            window.loginState.completed = true;
        }

        // Signal successful login via localStorage for any other listeners
        try {
            localStorage.setItem('spotify-login-success', Date.now().toString());
        } catch (e) {
            console.warn('Could not set localStorage for login success:', e);
        }

        // Force update window.config immediately for immediate UI feedback
        if (window.config) {
            window.config.isLoggedIn = true;
            window.authStateTimestamp = Date.now();
        }

        // Update UI immediately with optimistic state
        updateUI();

        // Then verify with server and update if needed
        checkAuthStatus().then(serverIsLoggedIn => {
            if (!serverIsLoggedIn) {
                // Server hasn't updated yet, start polling to wait for it
                startAuthPolling();
            }
        }).catch(error => {
            console.error('Error checking auth status after login:', error);
            // Keep the optimistic UI state since user successfully logged in
        });
    }

    // Listen for login success events from localStorage (cross-tab communication)
    window.addEventListener('storage', function(e) {
        if (e.key === 'spotify-login-success') {
            handleLoginSuccess('localStorage-event');
        }
    });

    // Set up the global callback function for popup communication
    window.spotifyLoginSuccess = function() {
        handleLoginSuccess('popup-callback');
    };

    // Listen for PostMessage events as additional communication method
    window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'spotify-login-success') {
            handleLoginSuccess('postmessage');
        }
    });

    // Listen for page visibility changes - check auth when page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && window.config && !window.config.isLoggedIn) {
            // Page became visible and user isn't logged in - do a quick check
            checkAuthStatus().then(isLoggedIn => {
                if (isLoggedIn) {
                    updateUI();
                }
            });
        }
    });

    // Reset login processing flag for new login attempts
    function resetLoginProcessing() {
        loginSuccessProcessed = false;
    }

    // Export functions for manual use if needed
    window.authPoller = {
        start: startAuthPolling,
        stop: stopAuthPolling,
        check: checkAuthStatus,
        handleLoginSuccess: handleLoginSuccess,
        resetLoginProcessing: resetLoginProcessing
    };
})();