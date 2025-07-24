const config = require('../config/app');

function LogService() {
    this.debug = function(...msg) {
        if(config.debug === 'true')
        {console.log('\n\n', ...msg);}
    };

    this.error = function(...msg) {
        console.error(msg);
    };
}


module.exports = new LogService();
