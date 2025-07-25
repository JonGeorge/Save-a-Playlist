/**
 * Security Module - Main Entry Point
 * 
 * This is the primary interface for all security functionality in the application.
 * It provides a clean, organized API for accessing headers, authentication,
 * middleware, and configuration.
 * 
 * Usage Examples:
 * 
 * // Import the main security module
 * const security = require('./security');
 * 
 * // Use pre-configured middleware
 * app.use('/', security.middleware.pages);
 * app.use('/login', security.middleware.oauth);
 * 
 * // Access authentication services
 * const user = security.auth.validateUserSession(token);
 * 
 * // Create custom security middleware
 * const customMiddleware = security.createMiddleware('api');
 */

// Core modules
const { createSecurityMiddleware, securityMiddleware } = require('./middleware');
const authService = require('./auth');
const config = require('./config');

// Header modules
const { createStandardHelmet, createOAuthHelmet } = require('./headers/helmet');
const { createManualSecurityMiddleware } = require('./headers/manual');
const csp = require('./headers/csp');

// Test utilities
const tests = require('./tests');

/**
 * Pre-configured security middleware for common use cases
 */
const middleware = {
    // Ready-to-use middleware for different route types
    pages: securityMiddleware.pages,
    oauth: securityMiddleware.oauth,
    api: securityMiddleware.api,
    static: securityMiddleware.static,
    
    // Custom middleware creation
    create: createSecurityMiddleware,
    createManual: createManualSecurityMiddleware
};

/**
 * Header utilities and configurations
 */
const headers = {
    // Helmet.js utilities
    helmet: {
        standard: createStandardHelmet,
        oauth: createOAuthHelmet
    },
    
    // Manual header implementation
    manual: createManualSecurityMiddleware,
    
    // CSP utilities
    csp: {
        create: csp.createCSPConfig,
        createHeader: csp.createCSPHeaderString,
        validate: csp.validateCSP
    }
};

/**
 * Authentication and JWT utilities
 */
const auth = authService;

/**
 * Configuration and environment utilities
 */
const configuration = config;

/**
 * Testing utilities
 */
const testing = {
    runAll: tests.runAllSecurityTests,
    runQuick: tests.runQuickSecurityCheck,
    individual: tests.tests
};

/**
 * Main security interface
 */
const security = {
    // Pre-configured middleware (most common use case)
    middleware,
    
    // Header management
    headers,
    
    // Authentication services
    auth,
    
    // Configuration
    config: configuration,
    
    // Testing utilities
    test: testing,
    
    // Convenience methods
    createMiddleware: createSecurityMiddleware,
    isProduction: config.isProduction,
    isDevelopment: config.isDevelopment,
    
    // Version info
    version: '1.0.0',
    description: 'Comprehensive security module for Spotify playlist application'
};

// Export the main security object
module.exports = security;

// Named exports for specific functionality
module.exports.middleware = middleware;
module.exports.headers = headers;
module.exports.auth = auth;
module.exports.config = configuration;
module.exports.test = testing;
module.exports.createMiddleware = createSecurityMiddleware;
