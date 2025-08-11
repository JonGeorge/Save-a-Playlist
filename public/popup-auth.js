(function() {
    'use strict';

    function createPopupWindow(url) {
        const popup = window.open(url, 'Spotify Login', 'toolbar=no, menubar=no, status=no, directories=no, height=750, width=600');
        if (window.focus) {
            popup.focus();
        }
        return popup;
    }

    function setupPopupListeners(popup) {
        const state = {
            popup: popup,
            completed: false,
            pollTimer: null,
            storageListener: null,
            messageListener: null
        };

        state.storageListener = function(e) {
            if (e.key === 'spotify-login-success' && !state.completed) {
                window.authHandler.handleLoginSuccess();
            }
        };

        state.messageListener = function(e) {
            if (e.data && e.data.type === 'spotify-login-success' && !state.completed) {
                window.authHandler.handleLoginSuccess();
            }
        };

        window.addEventListener('storage', state.storageListener);
        window.addEventListener('message', state.messageListener);

        return state;
    }

    function pollPopupState(state) {
        state.pollTimer = setInterval(function() {
            try {
                const popup = state.popup;
                
                if (popup.closed) {
                    clearInterval(state.pollTimer);
                    
                    const loginSuccess = localStorage.getItem('spotify-login-success');
                    const loginTimestamp = localStorage.getItem('spotify-login-timestamp');
                    const now = Date.now();

                    if (loginSuccess && loginTimestamp && (now - parseInt(loginTimestamp)) < 60000) {
                        window.authHandler.handleLoginSuccess();
                        return;
                    }

                    if (!state.completed) {
                        clearOAuthState();
                    }
                    return;
                }

                if (popup.name === 'spotify-login-success' && !state.completed) {
                    window.authHandler.handleLoginSuccess();
                }

                const loginSuccess = localStorage.getItem('spotify-login-success');
                if (loginSuccess && !state.completed) {
                    const timestamp = localStorage.getItem('spotify-login-timestamp');
                    if (timestamp && (Date.now() - parseInt(timestamp)) < 10000) {
                        window.authHandler.handleLoginSuccess();
                    }
                }
            } catch(e) {
                // Ignore cross-origin errors
            }
        }, 500);
    }

    function clearOAuthState() {
        fetch('/api/clearOAuthState', {
            method: 'POST',
            credentials: 'include'
        })
        .then(response => response.json())
        .catch(error => {
            console.warn('Failed to clear OAuth state:', error);
        });
    }

    function openLoginWindow(url) {
        if (window.authHandler && window.authHandler.resetLoginProcessing) {
            window.authHandler.resetLoginProcessing();
        }

        const popup = createPopupWindow(url);
        const state = setupPopupListeners(popup);
        
        window.loginState = state;
        pollPopupState(state);
    }

    window.popupAuth = {
        openLoginWindow: openLoginWindow
    };
})();