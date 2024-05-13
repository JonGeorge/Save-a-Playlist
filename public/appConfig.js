(function() {
    fetch("/getConfig")
    .then(res => res.json())
    .then(data => window.config = data)
    .catch(err => console.error(err));
})();