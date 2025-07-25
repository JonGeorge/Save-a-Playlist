/**
 * Helmet Configuration for Security Headers
 * 
 * This module provides Helmet.js configurations optimized for
 * serverless deployment and Spotify OAuth integration.
 */

const helmet = require('helmet');
const { createCSPConfig } = require('./csp');
const log = require('../../services/log');

/**
 * Standard Helmet configuration for most routes
 */
function createStandardHelmetConfig() {
    return {
        // Content Security Policy with Spotify domains
        contentSecurityPolicy: createCSPConfig('standard'),
        
        // Frame protection - prevent clickjacking
        frameguard: { 
            action: 'sameorigin' // Allow frames from same origin for OAuth
        },
        
        // Referrer policy - limit information leakage
        referrerPolicy: { 
            policy: 'strict-origin-when-cross-origin' 
        },
        
        // Disable headers that cause issues in serverless
        dnsPrefetchControl: false,
        hidePoweredBy: false,
        ieNoOpen: false,
        noSniff: true, // Keep this for security
        originAgentCluster: false,
        xssFilter: false, // Modern CSP is better
        
        // HSTS only in production
        hsts: process.env.NODE_ENV === 'production' ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        } : false,
        
        // Cross-origin policies for OAuth compatibility
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: {
            policy: 'same-origin-allow-popups' // Allow OAuth popups
        },
        crossOriginResourcePolicy: {
            policy: 'cross-origin' // Allow API calls
        }
    };
}

/**
 * OAuth-specific Helmet configuration
 * More permissive for authentication flows
 */
function createOAuthHelmetConfig() {
    const config = createStandardHelmetConfig();
    
    // Use OAuth-specific CSP
    config.contentSecurityPolicy = createCSPConfig('oauth');
    
    // More permissive cross-origin policy for OAuth
    config.crossOriginOpenerPolicy = {
        policy: 'unsafe-none' // Required for some OAuth flows
    };
    
    return config;
}

/**
 * Creates Helmet middleware with standard configuration
 */
function createStandardHelmet() {
    try {
        const config = createStandardHelmetConfig();
        return helmet(config);
    } catch (error) {
        log.error('Failed to create standard Helmet middleware:', error);
        throw error;
    }
}

/**
 * Creates Helmet middleware with OAuth-friendly configuration
 */
function createOAuthHelmet() {
    try {
        const config = createOAuthHelmetConfig();
        return helmet(config);
    } catch (error) {
        log.error('Failed to create OAuth Helmet middleware:', error);
        throw error;
    }
}

/**
 * Creates minimal Helmet middleware for development/debugging
 */
function createMinimalHelmet() {
    try {
        return helmet({
            contentSecurityPolicy: createCSPConfig('standard'),
            frameguard: { action: 'sameorigin' },
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
        });
    } catch (error) {
        log.error('Failed to create minimal Helmet middleware:', error);
        throw error;
    }
}

module.exports = {
    createStandardHelmet,
    createOAuthHelmet,
    createMinimalHelmet,
    createStandardHelmetConfig,
    createOAuthHelmetConfig
};
