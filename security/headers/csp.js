/**
 * Content Security Policy Configuration
 * 
 * This module defines CSP directives for different types of routes,
 * optimized for Spotify integration and external resources.
 */

/**
 * Base CSP configuration shared across all routes
 */
const BASE_CSP_DIRECTIVES = {
    defaultSrc: ["'self'"],
    
    scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some inline scripts
        'https://accounts.spotify.com', // Spotify OAuth
        'https://open.spotify.com' // Spotify embeds
    ],
    
    styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for dynamic styles
        'https://accounts.spotify.com', // Spotify OAuth styles
        'https://fonts.googleapis.com', // Google Fonts CSS
        'https://use.typekit.net', // Adobe TypeKit
        'https://p.typekit.net', // TypeKit processing
        'https://cdnjs.cloudflare.com' // CDN resources (Font Awesome)
    ],
    
    imgSrc: [
        "'self'",
        'data:', // Data URLs for icons
        'https://i.scdn.co', // Spotify image CDN
        'https://mosaic.scdn.co', // Spotify playlist mosaics
        'https://*.spotifycdn.com' // All Spotify CDN resources
    ],
    
    connectSrc: [
        "'self'",
        'https://api.spotify.com', // Spotify Web API
        'https://accounts.spotify.com' // Spotify OAuth
    ],
    
    fontSrc: [
        "'self'",
        'https://fonts.gstatic.com', // Google Fonts files
        'https://use.typekit.net', // TypeKit fonts
        'https://p.typekit.net', // TypeKit processing
        'https://cdnjs.cloudflare.com' // CDN font files
    ],
    
    frameSrc: [
        'https://open.spotify.com', // Spotify embeds
        'https://accounts.spotify.com' // OAuth frames
    ],
    
    formAction: [
        "'self'",
        'https://accounts.spotify.com' // OAuth form submissions
    ],
    
    baseUri: ["'self'"]
};

/**
 * OAuth-specific CSP configuration
 * More permissive for authentication flows
 */
const OAUTH_CSP_DIRECTIVES = {
    ...BASE_CSP_DIRECTIVES,
    
    frameSrc: [
        "'self'",
        'https://accounts.spotify.com',
        'https://*.spotify.com' // Broader Spotify domain access
    ],
    
    formAction: [
        "'self'",
        'https://accounts.spotify.com',
        'https://*.spotify.com' // Broader form submission access
    ]
};

/**
 * Builds CSP configuration for Helmet.js
 */
function createCSPConfig(type = 'standard') {
    const directives = type === 'oauth' ? OAUTH_CSP_DIRECTIVES : BASE_CSP_DIRECTIVES;
    
    return {
        directives
    };
}

/**
 * Builds CSP header string for manual implementation
 */
function createCSPHeaderString(type = 'standard') {
    const directives = type === 'oauth' ? OAUTH_CSP_DIRECTIVES : BASE_CSP_DIRECTIVES;
    
    const cspParts = [];
    
    for (const [directive, values] of Object.entries(directives)) {
        // Convert camelCase to kebab-case
        const kebabDirective = directive.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        const valueString = values.join(' ');
        cspParts.push(`${kebabDirective} ${valueString}`);
    }
    
    return cspParts.join('; ');
}

/**
 * Validates that all required domains are present in CSP
 */
function validateCSP(cspString) {
    const requiredDomains = [
        'accounts.spotify.com',
        'api.spotify.com',
        'fonts.googleapis.com',
        'typekit.net'
    ];
    
    const missing = requiredDomains.filter(domain => !cspString.includes(domain));
    
    if (missing.length > 0) {
        console.warn('CSP missing required domains:', missing);
    }
    
    return missing.length === 0;
}

module.exports = {
    BASE_CSP_DIRECTIVES,
    OAUTH_CSP_DIRECTIVES,
    createCSPConfig,
    createCSPHeaderString,
    validateCSP
};
