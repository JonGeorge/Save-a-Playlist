/**
 * Input sanitization utilities
 * Cleans and escapes user inputs to prevent XSS and injection attacks
 */

// Character escape mappings
const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
};

const SQL_ESCAPES = {
    "'": "''",
    '"': '""',
    '\\': '\\\\',
    '\0': '\\0',
    '\n': '\\n',
    '\r': '\\r',
    '\x1a': '\\Z'
};

// Regular expressions for cleaning
const REGEX_PATTERNS = {
    // Remove script tags and javascript
    SCRIPT_TAGS: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    JAVASCRIPT_PROTOCOL: /javascript:/gi,
    DATA_PROTOCOL: /data:/gi,
    VBSCRIPT_PROTOCOL: /vbscript:/gi,
    
    // Remove event handlers
    EVENT_HANDLERS: /\s*on\w+\s*=\s*['""][^'"]*['""]|\s*on\w+\s*=\s*[^>\s]+/gi,
    
    // Remove potentially dangerous attributes
    DANGEROUS_ATTRS: /\s*(style|onclick|onload|onerror|onmouseover)\s*=\s*['""][^'"]*['""]/gi,
    
    // Control characters and unusual whitespace
    CONTROL_CHARS: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
    ZERO_WIDTH: /[\u200B-\u200D\uFEFF]/g,
    
    // Multiple consecutive whitespace
    MULTIPLE_SPACES: /\s+/g,
    
    // SQL injection patterns to remove
    SQL_COMMENTS: /--.*$/gm,
    SQL_MULTILINE_COMMENTS: /\/\*.*?\*\//gs
};

module.exports = {
    /**
     * Escapes HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} HTML-escaped text
     */
    escapeHtml: (text) => {
        if (typeof text !== 'string') return '';
        
        return text.replace(/[&<>"'\/]/g, (char) => HTML_ESCAPES[char] || char);
    },

    /**
     * Removes HTML tags and content
     * @param {string} text - Text to strip
     * @returns {string} Text without HTML tags
     */
    stripHtml: (text) => {
        if (typeof text !== 'string') return '';
        
        return text
            .replace(REGEX_PATTERNS.SCRIPT_TAGS, '') // Remove script tags completely
            .replace(/<[^>]*>/g, '') // Remove all other HTML tags
            .replace(/&[a-zA-Z0-9#]+;/g, ' '); // Replace HTML entities with space
    },

    /**
     * Removes dangerous JavaScript patterns
     * @param {string} text - Text to clean
     * @returns {string} Cleaned text
     */
    removeJavaScript: (text) => {
        if (typeof text !== 'string') return '';
        
        return text
            .replace(REGEX_PATTERNS.JAVASCRIPT_PROTOCOL, '')
            .replace(REGEX_PATTERNS.DATA_PROTOCOL, '')
            .replace(REGEX_PATTERNS.VBSCRIPT_PROTOCOL, '')
            .replace(REGEX_PATTERNS.EVENT_HANDLERS, '')
            .replace(REGEX_PATTERNS.DANGEROUS_ATTRS, '');
    },

    /**
     * Cleans control characters and normalizes whitespace
     * @param {string} text - Text to clean
     * @param {object} options - Cleaning options
     * @returns {string} Cleaned text
     */
    cleanWhitespace: (text, options = {}) => {
        if (typeof text !== 'string') return '';
        
        const opts = {
            trim: true,
            normalizeSpaces: true,
            removeControlChars: true,
            ...options
        };
        
        let cleaned = text;
        
        // Remove control characters
        if (opts.removeControlChars) {
            cleaned = cleaned
                .replace(REGEX_PATTERNS.CONTROL_CHARS, '')
                .replace(REGEX_PATTERNS.ZERO_WIDTH, '');
        }
        
        // Normalize whitespace
        if (opts.normalizeSpaces) {
            cleaned = cleaned.replace(REGEX_PATTERNS.MULTIPLE_SPACES, ' ');
        }
        
        // Trim
        if (opts.trim) {
            cleaned = cleaned.trim();
        }
        
        return cleaned;
    },

    /**
     * Sanitizes search query input
     * @param {string} query - Search query to sanitize
     * @returns {string} Sanitized query
     */
    searchQuery: (query) => {
        if (typeof query !== 'string') return '';
        
        return module.exports.cleanWhitespace(
            module.exports.removeJavaScript(
                module.exports.stripHtml(query)
            )
        );
    },

    /**
     * Sanitizes playlist name input
     * @param {string} name - Playlist name to sanitize
     * @returns {string} Sanitized name
     */
    playlistName: (name) => {
        if (typeof name !== 'string') return '';
        
        return module.exports.cleanWhitespace(
            module.exports.removeJavaScript(
                module.exports.stripHtml(name)
            )
        );
    },

    /**
     * Sanitizes URL input
     * @param {string} url - URL to sanitize
     * @returns {string} Sanitized URL
     */
    url: (url) => {
        if (typeof url !== 'string') return '';
        
        let cleaned = url.trim();
        
        // Remove dangerous protocols
        cleaned = cleaned
            .replace(REGEX_PATTERNS.JAVASCRIPT_PROTOCOL, 'http:')
            .replace(REGEX_PATTERNS.DATA_PROTOCOL, 'http:')
            .replace(REGEX_PATTERNS.VBSCRIPT_PROTOCOL, 'http:');
        
        // Remove control characters but preserve URL structure
        cleaned = cleaned.replace(REGEX_PATTERNS.CONTROL_CHARS, '');
        
        return cleaned;
    },

    /**
     * Sanitizes general text input
     * @param {string} text - Text to sanitize
     * @param {object} options - Sanitization options
     * @returns {string} Sanitized text
     */
    text: (text, options = {}) => {
        if (typeof text !== 'string') return '';
        
        const opts = {
            allowHtml: false,
            escapeHtml: true,
            removeJs: true,
            normalizeWhitespace: true,
            ...options
        };
        
        let cleaned = text;
        
        // Remove JavaScript patterns
        if (opts.removeJs) {
            cleaned = module.exports.removeJavaScript(cleaned);
        }
        
        // Handle HTML
        if (!opts.allowHtml) {
            cleaned = module.exports.stripHtml(cleaned);
        } else if (opts.escapeHtml) {
            cleaned = module.exports.escapeHtml(cleaned);
        }
        
        // Clean whitespace
        if (opts.normalizeWhitespace) {
            cleaned = module.exports.cleanWhitespace(cleaned);
        }
        
        return cleaned;
    },

    /**
     * Escapes SQL special characters
     * @param {string} text - Text to escape for SQL
     * @returns {string} SQL-escaped text
     */
    escapeSql: (text) => {
        if (typeof text !== 'string') return '';
        
        return text.replace(/['"\\\0\n\r\x1a]/g, (char) => {
            return SQL_ESCAPES[char] || char;
        });
    },

    /**
     * Removes SQL injection patterns
     * @param {string} text - Text to clean
     * @returns {string} Cleaned text
     */
    removeSqlInjection: (text) => {
        if (typeof text !== 'string') return '';
        
        return text
            .replace(REGEX_PATTERNS.SQL_COMMENTS, '')
            .replace(REGEX_PATTERNS.SQL_MULTILINE_COMMENTS, '')
            .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+/gi, '');
    },

    /**
     * Sanitizes filename for safe filesystem operations
     * @param {string} filename - Filename to sanitize
     * @returns {string} Safe filename
     */
    filename: (filename) => {
        if (typeof filename !== 'string') return '';
        
        return filename
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid filename characters
            .replace(/^\.+/, '') // Remove leading dots
            .replace(/\.+$/, '') // Remove trailing dots
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .substring(0, 255); // Limit length
    },

    /**
     * Creates a sanitization middleware function
     * @param {object} options - Middleware options
     * @returns {function} Express middleware function
     */
    createMiddleware: (options = {}) => {
        return (req, res, next) => {
            const opts = {
                sanitizeBody: true,
                sanitizeQuery: true,
                sanitizeParams: true,
                ...options
            };
            
            // Sanitize request body
            if (opts.sanitizeBody && req.body) {
                req.body = module.exports.sanitizeObject(req.body);
            }
            
            // Sanitize query parameters
            if (opts.sanitizeQuery && req.query) {
                req.query = module.exports.sanitizeObject(req.query);
            }
            
            // Sanitize route parameters
            if (opts.sanitizeParams && req.params) {
                req.params = module.exports.sanitizeObject(req.params);
            }
            
            next();
        };
    },

    /**
     * Recursively sanitizes an object's string values
     * @param {any} obj - Object to sanitize
     * @returns {any} Sanitized object
     */
    sanitizeObject: (obj) => {
        if (typeof obj === 'string') {
            return module.exports.text(obj);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => module.exports.sanitizeObject(item));
        }
        
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                const cleanKey = module.exports.text(key);
                sanitized[cleanKey] = module.exports.sanitizeObject(value);
            }
            return sanitized;
        }
        
        return obj;
    }
};