function addEventListeners() {
    function poptastic(url) {
        var newWindow = window.open(url, 'Spotify Login', 'toolbar=no, menubar=no, status=no, directories=no, height=750, width=600');
        if (window.focus) {
          newWindow.focus();
        }

        var pollTimer   =   window.setInterval(function() { 
            try {
                // console.log(newWindow.document.URL);
                if (newWindow.document.URL.indexOf("/success") != -1) {
                    window.clearInterval(pollTimer);
                    var url =   newWindow.document.URL;
                    newWindow.close();
                }
            } catch(e) {
                // console.error(e);
            }
        }, 100);
    }

    document.getElementById("login").addEventListener("click", event => {
        poptastic("/login");
    })
}

addEventListeners();

