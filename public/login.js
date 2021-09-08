displayConnectToSpotifyButton();

function displayConnectToSpotifyButton() {
    if(window.config) {
        if(window.config.isLoggedIn) {
            const checkIcon = getCheckIcon(),
                  span = getSpan("Connected to Spotify"),
                  connectedToSpotifyDiv = getConnectedStatusElement(checkIcon, span);

            // If 'Connect to Spotify' button is on the page,
            // replace Connect button with text that says user
            // is already connected
            const connectToSpotifyBtn = document.getElementById("login");
            if(connectToSpotifyBtn) {
                const parent = connectToSpotifyBtn.parentNode;
                parent.replaceChild(connectedToSpotifyDiv, connectToSpotifyBtn);
            }

            // Connect to Spotify button is not on the page.
            // Append the right side header.
            else {
                const rightHeader = document.getElementsByClassName("right-header")[0];
                rightHeader.appendChild(connectedToSpotifyDiv);
            }
        }
        // Current session is not logged in
        else {
            const strong = document.createElement("strong");
            strong.textContent = "Connect to Spotify";

            const a = document.createElement("a");
            a.setAttribute("id", "login");
            a.setAttribute("href", "javascript:void(0);");
            a.appendChild(strong);

            a.addEventListener("click", event => {
                openLoginWindow("/login");
            });

            const rightHeader = document.getElementsByClassName("right-header")[0];
            rightHeader.appendChild(a);
        }
    }
    // Config hasn't loaded yet
    else {
        setTimeout(displayConnectToSpotifyButton, 50);
    }
}

function getCheckIcon() {
    const checkIcon = document.createElement("img");
    checkIcon.setAttribute("src", "/static/resources/check-mark-green.svg");
    checkIcon.setAttribute("class", "checkmark");

    return checkIcon;
}

function getSpan(txt) {
    const span = document.createElement("span");
    span.textContent = txt;

    return span;
}

function getConnectedStatusElement(element1, element2) {
    const div = document.createElement("div");
    div.setAttribute("class", "connected-text");
    div.appendChild(element1);
    div.appendChild(element2);

    return div;
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