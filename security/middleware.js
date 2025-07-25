/**
 * Security Middleware - Main Orchestrator
 * 
 * This module creates and manages security middleware by combining
 * Helmet.js configurations with fallback manual implementations.
 * 
 * Architecture:
 * 1. Try Helmet.js with optimized configuration
 * 2. Fall back to manual headers if Helmet fails
 * 3. Provide minimal headers as last resort
 */

const { createStandardHelmet, createOAuthHelmet } = require('./headers/helmet');
const { createManualSecurityMiddleware, createMinimalFallback } = require('./headers/manual');
const { MIDDLEWARE_TYPES } = require('./config');
const log = require('../services/log');

/**
 * Creates security middleware with automatic fallback handling
 * 
 * @param {string} type - Type of middleware (standard, oauth, api, static, debug)
 * @returns {Function} Express middleware function with error handling
 */
function createSecurityMiddleware(type = MIDDLEWARE_TYPES.STANDARD) {
    // Select the appropriate Helmet middleware based on type
    let helmetMiddleware;
    let fallbackType;
    
    switch (type) {
    case MIDDLEWARE_TYPES.OAUTH:
        helmetMiddleware = createOAuthHelmet();
        fallbackType = 'oauth';
        break;
            
    case MIDDLEWARE_TYPES.STANDARD:
    case MIDDLEWARE_TYPES.API:
    case MIDDLEWARE_TYPES.STATIC:
    default:
        helmetMiddleware = createStandardHelmet();
        fallbackType = 'standard';
        break;
    }
    
    // Return middleware with comprehensive error handling
    return async (req, res, next) => {
        try {
            // Attempt to use Helmet middleware
            helmetMiddleware(req, res, (helmetError) => {
                if (helmetError) {
                    log.error('Helmet middleware error:', helmetError);
                    handleHelmetFailure(req, res, next, fallbackType);
                } else {
                    // Helmet succeeded
                    log.debug(`Applied Helmet security headers for ${type} route`);
                    next();
                }
            });
            
        } catch (configError) {
            log.error('Helmet configuration error:', configError);
            handleHelmetFailure(req, res, next, fallbackType);
        }
    };
}

/**
 * Handles Helmet failures by falling back to manual headers
 */
function handleHelmetFailure(req, res, next, fallbackType) {
    log.debug('Falling back to manual security headers');
    
    try {
        const fallbackMiddleware = createManualSecurityMiddleware(fallbackType);
        fallbackMiddleware(req, res, next);
    } catch (fallbackError) {
        log.error('Manual security headers also failed:', fallbackError);
        handleFinalFallback(req, res, next);
    }
}

/**
 * Final fallback - minimal headers that should always work
 */
function handleFinalFallback(req, res, next) {
    log.warn('Using minimal security headers as last resort');
    
    try {
        const minimalMiddleware = createMinimalFallback();
        minimalMiddleware(req, res, next);
    } catch (error) {
        log.error('Even minimal headers failed, continuing without security headers:', error);
        next();
    }
}

/**
 * Auto-detection middleware that chooses appropriate security based on route
 */
function createAutoSecurityMiddleware(req, res, next) {
    const path = req.path || req.url;
    
    // Determine middleware type based on route patterns
    let middlewareType;
    
    if (path.includes('/login') || path.includes('/callback')) {
        middlewareType = MIDDLEWARE_TYPES.OAUTH;
    } else if (path.includes('/api/')) {
        middlewareType = MIDDLEWARE_TYPES.API;
    } else if (path === '/' || path.includes('/error') || path.includes('/success')) {
        middlewareType = MIDDLEWARE_TYPES.STANDARD;
    } else {
        middlewareType = MIDDLEWARE_TYPES.STATIC;
    }
    
    log.debug(`Auto-detected ${middlewareType} middleware for ${path}`);
    
    const middleware = createSecurityMiddleware(middlewareType);
    return middleware(req, res, next);
}

/**
 * Pre-configured middleware instances for common route types
 * These are created once and reused for better performance
 */
const securityMiddleware = {
    // Standard pages (/, /error, /success)
    pages: createSecurityMiddleware(MIDDLEWARE_TYPES.STANDARD),
    
    // OAuth routes (/login, /login/callback)  
    oauth: createSecurityMiddleware(MIDDLEWARE_TYPES.OAUTH),
    
    // API endpoints with specific configurations
    api: {
        search: createSecurityMiddleware(MIDDLEWARE_TYPES.API),
        save: createSecurityMiddleware(MIDDLEWARE_TYPES.API),
        config: createSecurityMiddleware(MIDDLEWARE_TYPES.API)
    },
    
    // Static content serving
    static: createSecurityMiddleware(MIDDLEWARE_TYPES.STATIC),
    
    // Auto-detection middleware
    auto: createAutoSecurityMiddleware
};

/**
 * Middleware factory for custom configurations
 */
function createCustomMiddleware(options = {}) {
    const {
        type = MIDDLEWARE_TYPES.STANDARD,
        enableFallback = true,
        logErrors = true
    } = options;
    
    if (!enableFallback) {
        // Simple middleware without fallback
        return type === MIDDLEWARE_TYPES.OAUTH ? createOAuthHelmet() : createStandardHelmet();
    }
    
    return createSecurityMiddleware(type);
}

/**
 * Error handling middleware for security-related errors
 */
function createSecurityErrorHandler() {
    return (err, req, res, next) => {
        if (err && err.message && err.message.includes('security')) {
            log.error('Security middleware error:', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method,
                ip: req.ip || 'unknown'
            });
            
            // Don't expose internal error details to client
            return res.status(500).json({
                error: 'Security configuration error',
                message: 'Please try again later'
            });
        }
        
        next(err);
    };
}

module.exports = {
    // Main factory function
    createSecurityMiddleware,
    
    // Pre-configured middleware
    securityMiddleware,
    
    // Custom middleware creation
    createCustomMiddleware,
    
    // Auto-detection middleware
    createAutoSecurityMiddleware,
    
    // Error handling
    createSecurityErrorHandler,
    
    // Utility functions
    handleHelmetFailure,
    handleFinalFallback,
    
    // Constants
    MIDDLEWARE_TYPES
};
