/**
 * Input validation utilities
 * Validates user inputs against expected formats and constraints
 */

// Common validation patterns
const PATTERNS = {
    // Spotify URL patterns
    SPOTIFY_PLAYLIST_URL: /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+(\?.*)?$/,
    SPOTIFY_TRACK_URL: /^https:\/\/api\.spotify\.com\/v1\/playlists\/[a-zA-Z0-9]+\/tracks(\?.*)?$/,

    // Basic patterns
    ALPHANUMERIC: /^[a-zA-Z0-9\s\-_.]+$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // Special characters that might indicate attacks
    SUSPICIOUS_CHARS: /<script|javascript:|data:|vbscript:|onload=|onerror=|onclick=/i,
    SQL_INJECTION: /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s/i,
    XSS_PATTERNS: /(<|>|"|'|&lt;|&gt;|&quot;|&#|javascript:|data:)/i
};

// Default validation options
const DEFAULT_OPTIONS = {
    maxLength: 1000,
    minLength: 0,
    allowEmpty: false,
    allowSpecialChars: false,
    trimWhitespace: true
};

module.exports = {
    /**
     * Validates search query input
     * @param {string} query - Search query string
     * @param {object} options - Validation options
     * @returns {object} { isValid: boolean, errors: array }
     */
    searchQuery: (query, options = {}) => {
        const opts = { ...DEFAULT_OPTIONS, maxLength: 200, allowSpecialChars: true, ...options };
        const errors = [];

        // Basic type and existence checks
        if (typeof query !== 'string') {
            errors.push('Search query must be a string');
            return { isValid: false, errors };
        }

        const trimmed = opts.trimWhitespace ? query.trim() : query;

        // Empty check
        if (!opts.allowEmpty && (!trimmed || trimmed.length === 0)) {
            errors.push('Search query cannot be empty');
            return { isValid: false, errors };
        }

        // Length checks
        if (trimmed.length > opts.maxLength) {
            errors.push(`Search query cannot exceed ${opts.maxLength} characters`);
        }

        if (trimmed.length < opts.minLength) {
            errors.push(`Search query must be at least ${opts.minLength} characters`);
        }

        // Security checks
        if (PATTERNS.SUSPICIOUS_CHARS.test(trimmed)) {
            errors.push('Search query contains potentially dangerous characters');
        }

        if (PATTERNS.SQL_INJECTION.test(trimmed)) {
            errors.push('Search query contains potentially malicious SQL patterns');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validates playlist name input
     * @param {string} name - Playlist name
     * @param {object} options - Validation options
     * @returns {object} { isValid: boolean, errors: array }
     */
    playlistName: (name, options = {}) => {
        const opts = { ...DEFAULT_OPTIONS, maxLength: 100, allowSpecialChars: true, ...options };
        const errors = [];

        // Basic type and existence checks
        if (typeof name !== 'string') {
            errors.push('Playlist name must be a string');
            return { isValid: false, errors };
        }

        const trimmed = opts.trimWhitespace ? name.trim() : name;

        // Empty check
        if (!opts.allowEmpty && (!trimmed || trimmed.length === 0)) {
            errors.push('Playlist name cannot be empty');
            return { isValid: false, errors };
        }

        // Length checks
        if (trimmed.length > opts.maxLength) {
            errors.push(`Playlist name cannot exceed ${opts.maxLength} characters`);
        }

        if (trimmed.length < opts.minLength) {
            errors.push(`Playlist name must be at least ${opts.minLength} characters`);
        }

        // Security checks
        if (PATTERNS.SUSPICIOUS_CHARS.test(trimmed)) {
            errors.push('Playlist name contains potentially dangerous characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validates URL input
     * @param {string} url - URL string
     * @param {object} options - Validation options
     * @returns {object} { isValid: boolean, errors: array }
     */
    url: (url, options = {}) => {
        const opts = { ...DEFAULT_OPTIONS, maxLength: 2000, requireSpotify: false, ...options };
        const errors = [];

        // Basic type check
        if (typeof url !== 'string') {
            errors.push('URL must be a string');
            return { isValid: false, errors };
        }

        const trimmed = opts.trimWhitespace ? url.trim() : url;

        // Empty check
        if (!opts.allowEmpty && (!trimmed || trimmed.length === 0)) {
            errors.push('URL cannot be empty');
            return { isValid: false, errors };
        }

        // Length check
        if (trimmed.length > opts.maxLength) {
            errors.push(`URL cannot exceed ${opts.maxLength} characters`);
        }

        // Basic URL format validation
        try {
            new URL(trimmed);
        } catch (e) {
            errors.push('Invalid URL format');
            return { isValid: false, errors };
        }

        // Protocol validation
        const urlObj = new URL(trimmed);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            errors.push('URL must use HTTP or HTTPS protocol');
        }

        // Spotify-specific validation
        if (opts.requireSpotify) {
            if (!trimmed.includes('spotify.com') && !trimmed.includes('scdn.co')) {
                errors.push('URL must be from Spotify domain');
            }
        }

        // Security checks
        if (PATTERNS.SUSPICIOUS_CHARS.test(trimmed)) {
            errors.push('URL contains potentially dangerous characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validates general text input
     * @param {string} text - Text input
     * @param {object} options - Validation options
     * @returns {object} { isValid: boolean, errors: array }
     */
    text: (text, options = {}) => {
        const opts = { ...DEFAULT_OPTIONS, ...options };
        const errors = [];

        // Basic type check
        if (typeof text !== 'string') {
            errors.push('Input must be a string');
            return { isValid: false, errors };
        }

        const trimmed = opts.trimWhitespace ? text.trim() : text;

        // Empty check
        if (!opts.allowEmpty && (!trimmed || trimmed.length === 0)) {
            errors.push('Input cannot be empty');
            return { isValid: false, errors };
        }

        // Length checks
        if (trimmed.length > opts.maxLength) {
            errors.push(`Input cannot exceed ${opts.maxLength} characters`);
        }

        if (trimmed.length < opts.minLength) {
            errors.push(`Input must be at least ${opts.minLength} characters`);
        }

        // Character validation
        if (!opts.allowSpecialChars && !PATTERNS.ALPHANUMERIC.test(trimmed)) {
            errors.push('Input contains invalid characters');
        }

        // Security checks
        if (PATTERNS.SUSPICIOUS_CHARS.test(trimmed)) {
            errors.push('Input contains potentially dangerous characters');
        }

        if (PATTERNS.XSS_PATTERNS.test(trimmed)) {
            errors.push('Input contains potentially malicious patterns');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validates boolean input
     * @param {any} value - Value to validate as boolean
     * @returns {object} { isValid: boolean, errors: array }
     */
    boolean: (value) => {
        const errors = [];

        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            errors.push('Value must be a boolean or boolean string');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validates JWT token format
     * @param {string} token - JWT token
     * @returns {object} { isValid: boolean, errors: array }
     */
    jwtToken: (token) => {
        const errors = [];

        if (typeof token !== 'string') {
            errors.push('Token must be a string');
            return { isValid: false, errors };
        }

        // Basic JWT format check (3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3) {
            errors.push('Invalid JWT token format');
        }

        // Check for suspicious patterns
        if (PATTERNS.SUSPICIOUS_CHARS.test(token)) {
            errors.push('Token contains potentially dangerous characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Export patterns for external use
    PATTERNS
};
