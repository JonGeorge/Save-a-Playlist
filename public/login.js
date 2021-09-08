displayConnectToSpotifyButton();

function displayConnectToSpotifyButton() {
    if(window.config) {
        const loggedIn = window.config.isLoggedIn;

        if(loggedIn) {
            const checkIcon = document.createElement("img");
            checkIcon.setAttribute("src", "/static/resources/check-mark-green.svg");
            checkIcon.setAttribute("class", "checkmark")

            const span = document.createElement("span")
            span.textContent = "Connected to Spotify";

            const connectedToSpotifyDiv = document.createElement("div");
            connectedToSpotifyDiv.setAttribute("class", "connected-text");
            connectedToSpotifyDiv.appendChild(checkIcon);
            connectedToSpotifyDiv.appendChild(span);

            const connectToSpotifyBtn = document.getElementById("login");

            if(connectToSpotifyBtn) {
                const parent = connectToSpotifyBtn.parentNode;
                parent.replaceChild(connectedToSpotifyDiv, connectToSpotifyBtn);
            }
            else {
                const rightHeader = document.getElementsByClassName("right-header")[0];
                rightHeader.appendChild(connectedToSpotifyDiv);
            }
        }
        else {
            const strong = document.createElement("strong");
            strong.textContent = "Connect to Spotify";

            const a = document.createElement("a");
            a.setAttribute("id", "login");
            a.appendChild(strong);

            a.addEventListener("click", event => {
                openLoginWindow("/login");
            });

            const rightHeader = document.getElementsByClassName("right-header")[0];
            rightHeader.appendChild(a);

        }
    }
    else {
        setTimeout(displayConnectToSpotifyButton, 50);
    }
}

function openLoginWindow(url) {
    var newWindow = window.open(url, 'Spotify Login', 'toolbar=no, menubar=no, status=no, directories=no, height=750, width=600');
    if (window.focus) {
        newWindow.focus();
    }

    var pollTimer   =   window.setInterval(function() {
        try {
            // console.log(newWindow.document.URL);
            if (newWindow.document.URL.indexOf("/success") !== -1) {
                window.clearInterval(pollTimer);

                window.config.isLoggedIn = true;
                displayConnectToSpotifyButton()

                // var url =   newWindow.document.URL;
                newWindow.close();
            }
        } catch(e) {
            // console.error(e);
        }
    }, 100);
}