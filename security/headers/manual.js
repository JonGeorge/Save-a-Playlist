/**
 * Manual Security Headers Implementation
 * 
 * Fallback implementation that sets security headers manually
 * without relying on Helmet.js - useful for maximum compatibility.
 */

const { createCSPHeaderString } = require('./csp');
const log = require('../../services/log');

/**
 * Essential security headers that should always be set
 */
const ESSENTIAL_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

/**
 * Production-only security headers
 */
const PRODUCTION_HEADERS = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

/**
 * Sets essential security headers manually
 */
function setEssentialHeaders(res) {
    try {
        for (const [header, value] of Object.entries(ESSENTIAL_HEADERS)) {
            res.setHeader(header, value);
        }
        
        // Add production headers if in production
        if (process.env.NODE_ENV === 'production') {
            for (const [header, value] of Object.entries(PRODUCTION_HEADERS)) {
                res.setHeader(header, value);
            }
        }
        
        return true;
    } catch (error) {
        log.error('Failed to set essential headers:', error);
        return false;
    }
}

/**
 * Sets Content Security Policy header
 */
function setCSPHeader(res, type = 'standard') {
    try {
        const cspValue = createCSPHeaderString(type);
        res.setHeader('Content-Security-Policy', cspValue);
        return true;
    } catch (error) {
        log.error('Failed to set CSP header:', error);
        return false;
    }
}

/**
 * Creates manual security middleware for standard routes
 */
function createManualSecurityMiddleware(type = 'standard') {
    return (req, res, next) => {
        try {
            // Set essential headers
            const essentialSuccess = setEssentialHeaders(res);
            
            // Set CSP header
            const cspSuccess = setCSPHeader(res, type);
            
            if (!essentialSuccess || !cspSuccess) {
                log.warn('Some security headers failed to set, but continuing...');
            }
            
            log.debug(`Applied manual security headers for ${type} route`);
            next();
            
        } catch (error) {
            log.error('Manual security middleware error:', error);
            // Continue even if headers fail - don't break the app
            next();
        }
    };
}

/**
 * Ultra-minimal headers for emergency fallback
 */
function createMinimalFallback() {
    return (req, res, next) => {
        try {
            // Only set the most critical headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            
            log.debug('Applied minimal fallback headers');
        } catch (error) {
            log.error('Even minimal headers failed:', error);
        }
        
        next();
    };
}

/**
 * Validates that security headers are properly set
 */
function validateSecurityHeaders(res) {
    const requiredHeaders = Object.keys(ESSENTIAL_HEADERS);
    const missing = [];
    
    for (const header of requiredHeaders) {
        if (!res.getHeader(header)) {
            missing.push(header);
        }
    }
    
    if (missing.length > 0) {
        log.warn('Missing security headers:', missing);
    }
    
    return missing.length === 0;
}

module.exports = {
    createManualSecurityMiddleware,
    createMinimalFallback,
    setEssentialHeaders,
    setCSPHeader,
    validateSecurityHeaders,
    ESSENTIAL_HEADERS,
    PRODUCTION_HEADERS
};
