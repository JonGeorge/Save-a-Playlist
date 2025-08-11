(function() {
    'use strict';

    let loginSuccessProcessed = false;

    function updateUI() {
        const displayFn = window.displayConnectToSpotifyButton;
        
        if (typeof displayFn === 'function') {
            try {
                displayFn();
            } catch (error) {
                console.error('Error updating UI:', error);
            }
            return;
        }

        setTimeout(() => {
            if (typeof window.displayConnectToSpotifyButton === 'function') {
                window.displayConnectToSpotifyButton();
            } else {
                window.dispatchEvent(new CustomEvent('authStatusChanged', {
                    detail: { isLoggedIn: window.config?.isLoggedIn || false }
                }));
            }
        }, 100);
    }

    function cleanupPopupState() {
        if (!window.loginState) return;
        
        const state = window.loginState;
        
        if (state.popup && !state.popup.closed) {
            state.popup.close();
        }
        
        if (state.storageListener) {
            window.removeEventListener('storage', state.storageListener);
        }
        
        if (state.messageListener) {
            window.removeEventListener('message', state.messageListener);
        }
        
        if (state.pollTimer) {
            clearInterval(state.pollTimer);
        }
        
        state.completed = true;
    }

    function handleLoginSuccess() {
        if (loginSuccessProcessed) return;
        loginSuccessProcessed = true;

        cleanupPopupState();

        try {
            localStorage.setItem('spotify-login-success', Date.now().toString());
        } catch (e) {
            console.warn('Could not set localStorage for login success:', e);
        }

        if (window.config) {
            window.config.isLoggedIn = true;
        }

        updateUI();
    }

    function resetLoginProcessing() {
        loginSuccessProcessed = false;
    }

    const authEventHandlers = {
        storage: function(e) {
            if (e.key === 'spotify-login-success') {
                handleLoginSuccess();
            }
        },
        
        message: function(e) {
            if (e.data && e.data.type === 'spotify-login-success') {
                handleLoginSuccess();
            }
        }
    };

    window.addEventListener('storage', authEventHandlers.storage);
    window.addEventListener('message', authEventHandlers.message);
    
    window.spotifyLoginSuccess = handleLoginSuccess;

    window.authHandler = {
        handleLoginSuccess,
        resetLoginProcessing
    };
})();