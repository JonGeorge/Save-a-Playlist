/**
 * Security Configuration Index
 * 
 * Central configuration for all security settings including
 * route-specific policies and environment-based configurations.
 */

/**
 * Security middleware types for different route categories
 */
const MIDDLEWARE_TYPES = {
    STANDARD: 'standard',
    OAUTH: 'oauth', 
    API: 'api',
    STATIC: 'static',
    DEBUG: 'debug'
};

/**
 * Route-specific security configurations
 */
const ROUTE_CONFIGS = {
    // Standard pages (/, /error, /success)
    pages: {
        type: MIDDLEWARE_TYPES.STANDARD,
        description: 'Standard security for public pages'
    },
    
    // OAuth authentication routes
    oauth: {
        type: MIDDLEWARE_TYPES.OAUTH,
        description: 'OAuth-friendly security for login flows'
    },
    
    // API endpoints
    api: {
        search: {
            type: MIDDLEWARE_TYPES.API,
            description: 'Security for search API endpoint'
        },
        save: {
            type: MIDDLEWARE_TYPES.API,
            description: 'Security for playlist save endpoint'
        },
        config: {
            type: MIDDLEWARE_TYPES.API,
            description: 'Security for configuration endpoint'
        }
    },
    
    // Static content
    static: {
        type: MIDDLEWARE_TYPES.STATIC,
        description: 'Security for static file serving'
    }
};

/**
 * Environment-specific configurations
 */
const ENVIRONMENT_CONFIG = {
    development: {
        strictMode: false,
        allowUnsafeEval: true,
        enableDebugHeaders: true,
        logLevel: 'debug'
    },
    
    production: {
        strictMode: true,
        allowUnsafeEval: false,
        enableDebugHeaders: false,
        logLevel: 'warn',
        enforceHTTPS: true
    },
    
    test: {
        strictMode: false,
        allowUnsafeEval: true,
        enableDebugHeaders: true,
        logLevel: 'error'
    }
};

/**
 * Gets configuration for current environment
 */
function getCurrentEnvironmentConfig() {
    const env = process.env.NODE_ENV || 'development';
    return ENVIRONMENT_CONFIG[env] || ENVIRONMENT_CONFIG.development;
}

/**
 * Checks if running in production mode
 */
function isProduction() {
    return process.env.NODE_ENV === 'production';
}

/**
 * Checks if running in development mode
 */
function isDevelopment() {
    return process.env.NODE_ENV !== 'production';
}

/**
 * Gets security configuration for a specific route type
 */
function getRouteConfig(routeType) {
    return ROUTE_CONFIGS[routeType] || ROUTE_CONFIGS.pages;
}

module.exports = {
    MIDDLEWARE_TYPES,
    ROUTE_CONFIGS,
    ENVIRONMENT_CONFIG,
    getCurrentEnvironmentConfig,
    isProduction,
    isDevelopment,
    getRouteConfig
};
