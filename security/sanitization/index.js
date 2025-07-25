/**
 * Input sanitization and validation utilities
 * Protects against XSS, injection attacks, and malformed data
 */

const validator = require('./validator');
const sanitizer = require('./sanitizer');

module.exports = {
    // Validation functions
    validate: validator,
    
    // Sanitization functions
    sanitize: sanitizer,
    
    // Combined validate and sanitize
    process: {
        /**
         * Validates and sanitizes search query input
         * @param {string} query - Search query string
         * @param {object} options - Validation options
         * @returns {object} { isValid: boolean, sanitized: string, errors: array }
         */
        searchQuery: (query, options = {}) => {
            const validation = validator.searchQuery(query, options);
            if (!validation.isValid) {
                return validation;
            }
            
            const sanitized = sanitizer.searchQuery(query);
            return {
                isValid: true,
                sanitized,
                errors: []
            };
        },

        /**
         * Validates and sanitizes playlist name input
         * @param {string} name - Playlist name
         * @param {object} options - Validation options
         * @returns {object} { isValid: boolean, sanitized: string, errors: array }
         */
        playlistName: (name, options = {}) => {
            const validation = validator.playlistName(name, options);
            if (!validation.isValid) {
                return validation;
            }
            
            const sanitized = sanitizer.playlistName(name);
            return {
                isValid: true,
                sanitized,
                errors: []
            };
        },

        /**
         * Validates and sanitizes URL input
         * @param {string} url - URL string
         * @param {object} options - Validation options
         * @returns {object} { isValid: boolean, sanitized: string, errors: array }
         */
        url: (url, options = {}) => {
            const validation = validator.url(url, options);
            if (!validation.isValid) {
                return validation;
            }
            
            const sanitized = sanitizer.url(url);
            return {
                isValid: true,
                sanitized,
                errors: []
            };
        },

        /**
         * Validates and sanitizes general text input
         * @param {string} text - Text input
         * @param {object} options - Validation options
         * @returns {object} { isValid: boolean, sanitized: string, errors: array }
         */
        text: (text, options = {}) => {
            const validation = validator.text(text, options);
            if (!validation.isValid) {
                return validation;
            }
            
            const sanitized = sanitizer.text(text);
            return {
                isValid: true,
                sanitized,
                errors: []
            };
        }
    },

    // Middleware factory
    createMiddleware: (type = 'standard') => {
        return (req, res, next) => {
            // Add sanitization methods to request object
            req.sanitize = sanitizer;
            req.validate = validator;
            req.processInput = module.exports.process;
            
            next();
        };
    }
};