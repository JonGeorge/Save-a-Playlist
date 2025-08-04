(function() {
    'use strict';

    let pollTimer = null;
    let pollCount = 0;
    let isPolling = false;

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
            displayConnectToSpotifyButton();
        } else {
            // Fallback: manually trigger the login.js IIFE
            const script = document.createElement('script');
            script.textContent = `
                if (window.config && window.config.isLoggedIn) {
                    const event = new CustomEvent('authStatusChanged', { detail: { isLoggedIn: true } });
                    window.dispatchEvent(event);
                }
            `;
            document.head.appendChild(script);
            document.head.removeChild(script);
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
            checkAuthStatus().then(isLoggedIn => {
                if (isLoggedIn === true) {
                    // User is now logged in - update UI and stop polling
                    updateUI();
                    stopAuthPolling();
                    return;
                }

                if (isLoggedIn === null) {
                    // Error occurred - stop polling to avoid spam
                    stopAuthPolling();
                    return;
                }

                // Continue polling with appropriate interval
                pollCount++;
                const interval = pollCount < MAX_INITIAL_POLLS ? INITIAL_INTERVAL : EXTENDED_INTERVAL;

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
     * Handles login success events from popup window
     */
    function handleLoginSuccess() {
        // Stop any existing polling
        stopAuthPolling();

        // Reset auth cache timestamp to force fresh check
        window.authStateTimestamp = 0;

        checkAuthStatus().then(isLoggedIn => {
            if (isLoggedIn) {
                updateUI();
            } else {
                // Server hasn't updated yet, start polling
                startAuthPolling();
            }
        });
    }

    // Listen for login success events from localStorage (cross-tab communication)
    window.addEventListener('storage', function(e) {
        if (e.key === 'spotify-login-success') {
            handleLoginSuccess();
        }
    });

    // Listen for direct login success calls
    const originalSpotifyLoginSuccess = window.spotifyLoginSuccess;
    window.spotifyLoginSuccess = function() {
        handleLoginSuccess();
        if (originalSpotifyLoginSuccess) {
            originalSpotifyLoginSuccess();
        }
    };

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

    // Export functions for manual use if needed
    window.authPoller = {
        start: startAuthPolling,
        stop: stopAuthPolling,
        check: checkAuthStatus
    };
})();