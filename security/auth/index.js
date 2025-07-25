/**
 * Authentication Module Index
 * 
 * Central export point for all authentication-related functionality
 * including JWT handling, Spotify OAuth, and token management.
 */

// JWT operations
const jwtService = require('./jwt');

// Spotify OAuth flows
const authorizationCode = require('./authorizationCode');
const clientCredential = require('./clientCredential');

// Token management
const tokenService = require('./token');

/**
 * Main authentication service combining all auth functionality
 */
const authService = {
    // JWT operations
    jwt: jwtService,
    
    // OAuth flows
    oauth: {
        authorizationCode,
        clientCredential
    },
    
    // Token management
    tokens: tokenService,
    
    // Convenience methods
    createUserSession: (tokens, userId) => {
        return jwtService.createSessionPayload(tokens, userId, true);
    },
    
    validateUserSession: (authToken) => {
        return jwtService.verifyToken(authToken);
    },
    
    isUserLoggedIn: (authToken) => {
        const decoded = jwtService.verifyToken(authToken);
        return !!(decoded && decoded.tokens && decoded.tokens.access_token);
    }
};

module.exports = authService;

// Named exports for specific imports
module.exports.jwtService = jwtService;
module.exports.authorizationCode = authorizationCode;
module.exports.clientCredential = clientCredential;
module.exports.tokenService = tokenService;
