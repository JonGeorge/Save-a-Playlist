(function() {
    document.getElementById('search-input').addEventListener('keyup', event => {
        const input = event.target.value;
        playlistDomUtils.handleSearchEvent(input);
    });

    // Disable enter key on input text fields
    window.addEventListener('keydown',function(e) {
        if(e.keyIdentifier === 'U+000A' || e.keyIdentifier === 'Enter' || e.keyCode === 13) {
            if(e.target.nodeName === 'INPUT' && e.target.type === 'text') {
                e.preventDefault();
                return false;
            }
        }
    },true);
})();

