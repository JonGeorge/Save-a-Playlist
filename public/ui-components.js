(function() {
    'use strict';

    function createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    }

    function createCheckIcon() {
        return createElement('img', {
            'src': './resources/check-mark-green.svg',
            'class': 'checkmark'
        });
    }

    function createConnectButton() {
        const strong = createElement('strong', {}, 'Connect to Spotify');
        const button = createElement('a', { 'id': 'login' });
        
        button.appendChild(strong);
        button.addEventListener('click', () => {
            window.popupAuth.openLoginWindow('/login');
        });
        
        return button;
    }

    function createConnectedStatus() {
        const div = createElement('div', { 'class': 'connected-text' });
        const checkIcon = createCheckIcon();
        const span = createElement('span', {}, 'Connected to Spotify');
        
        div.appendChild(checkIcon);
        div.appendChild(span);
        
        return div;
    }

    function updateLoginButton() {
        if (!window.config) {
            setTimeout(updateLoginButton, 50);
            return;
        }

        const rightHeader = document.querySelector('.right-header');
        const existingBtn = document.getElementById('login');
        
        if (window.config.isLoggedIn) {
            const connectedStatus = createConnectedStatus();
            
            if (existingBtn) {
                existingBtn.parentNode.replaceChild(connectedStatus, existingBtn);
            } else if (rightHeader) {
                rightHeader.appendChild(connectedStatus);
            }
        } else {
            const connectButton = createConnectButton();
            
            if (existingBtn) {
                existingBtn.parentNode.replaceChild(connectButton, existingBtn);
            } else if (rightHeader) {
                rightHeader.appendChild(connectButton);
            }
        }
    }

    window.displayConnectToSpotifyButton = updateLoginButton;
    updateLoginButton();
})();