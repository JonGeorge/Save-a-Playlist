(function() {
    fetch('/getConfig')
        .then(res => res.json())
        .then(data => {
            window.config = data;
            window.authStateTimestamp = Date.now();
        })
        .catch(err => console.error(err));
})();
