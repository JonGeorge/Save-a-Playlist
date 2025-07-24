module.exports = {
    /**
     * Converts a one dimensional Javascript object to query string format.
     * 
     * @param {object} json Object to be converted.
     * @returns {string} a query string that can be appended to a URL.
     */
    jsonToQueryStr: (json) => {
        let str = '';

        Object.keys(json).forEach((key, i, arr) => {
            str += `${key}=${json[key]}`;
            str += i !== arr.length-1 ? '&' : '';
        });

        return str;
    },

    /**
     * Generates a string of random alpha-numeric characters.
     * 
     * @param {number} length The number of characters desired in the returned value.
     * @returns string of random alpha-numeric characters
     */
    getRandomString: (length) => {
        let str   = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < length; i++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return str;
    },

    getFormattedDateStr: (dateTimeStr) => {
        let date = new Date(dateTimeStr);

        if(isNaN(date.getTime())) {
            date = new Date();
        }
        
        const mm = String(date.getMonth() + 1).padStart(2, 0);
        const dd = String(date.getDate()).padStart(2, 0);
        const yyyy = date.getFullYear();
        
        return `${mm}/${dd}/${yyyy}`;
    },

    /**
     * Parses cookies from request headers for serverless environment
     * 
     * @param {object} req - Express/Vercel request object
     * @returns {object} Object with cookie name-value pairs
     */
    parseCookies: (req) => {
        const cookies = {};
        if (req.headers.cookie) {
            req.headers.cookie.split(';').forEach(cookie => {
                const parts = cookie.trim().split('=');
                if (parts.length === 2) {
                    cookies[parts[0]] = parts[1];
                }
            });
        }
        return cookies;
    },

    /**
     * Parses request body from URL-encoded form data or JSON
     * 
     * @param {string|object} reqBody - Raw request body
     * @returns {object} Parsed body object
     */
    parseRequestBody: (reqBody) => {
        if (!reqBody) {
            return {};
        }
        
        if (typeof reqBody === 'string') {
            const body = {};
            const urlParams = new URLSearchParams(reqBody);
            for (const [key, value] of urlParams) {
                body[key] = value;
            }
            return body;
        }
        
        return reqBody;
    }
};
