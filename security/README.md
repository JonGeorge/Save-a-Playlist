# Security Module

A comprehensive, organized security system for the Save-a-Playlist application, optimized for Vercel serverless deployment with Spotify OAuth integration.

## Architecture Overview

The security module is organized into logical components with clear separation of concerns:

```
security/
├── index.js              # Main entry point - use this for imports
├── middleware.js          # Main orchestrator with fallback handling
├── auth/                  # Authentication & JWT functionality
├── headers/               # Security headers (Helmet & manual)
├── config/                # Configuration & environment settings
└── tests/                 # Test suites and validation
```

## Quick Start

### Basic Usage

```javascript
// Import the main security module
const security = require('./security');

// Apply to routes
app.use('/', security.middleware.pages);
app.use('/login', security.middleware.oauth);
app.use('/api/search', security.middleware.api.search);
```

### Authentication

```javascript
const { auth } = require('./security');

// Validate user session
const user = auth.validateUserSession(token);

// Create JWT
const sessionPayload = auth.createUserSession(tokens, userId);
const jwt = auth.jwt.generateToken(sessionPayload);
```

### Input Sanitization

```javascript
const { sanitize } = require('./security');

// Validate and sanitize search queries
const result = sanitize.process.searchQuery(userInput);
if (result.isValid) {
    console.log('Sanitized query:', result.sanitized);
} else {
    console.log('Validation errors:', result.errors);
}

// Sanitize playlist names
const cleanName = sanitize.sanitize.playlistName(playlistName);

// Validate URLs
const urlValidation = sanitize.validate.url(url, { requireSpotify: true });
```

## Module Structure

### Core Modules

**`index.js`** - Main entry point
- Provides unified API for all security functionality
- Pre-configured middleware for common use cases
- Convenience methods for authentication

**`middleware.js`** - Security middleware orchestrator
- Combines Helmet.js with manual fallbacks
- Automatic error handling and graceful degradation
- Route-specific security configurations

### Specialized Modules

**`auth/`** - Authentication functionality
- `jwt.js` - JWT token operations
- `authorizationCode.js` - Spotify OAuth authorization code flow
- `clientCredential.js` - Spotify client credentials flow
- `token.js` - Token management utilities
- `index.js` - Unified auth interface

**`headers/`** - Security headers management
- `csp.js` - Content Security Policy configuration
- `helmet.js` - Helmet.js configurations
- `manual.js` - Manual header implementation
- Supports both Helmet.js and fallback approaches

**`config/`** - Configuration management
- Environment-specific settings
- Route type definitions
- Security policy configurations

**`sanitization/`** - Input sanitization and validation
- `validator.js` - Input validation utilities
- `sanitizer.js` - Data sanitization functions
- `index.js` - Combined validation and sanitization interface
- Protection against XSS, injection attacks, and malformed data

**`tests/`** - Testing utilities
- Comprehensive test suites
- CSP validation
- Header verification
- Integration testing
- Sanitization testing

## Usage Examples

### Applying Security Middleware

```javascript
const security = require('./security');

// Standard pages
app.use('/', security.middleware.pages);

// OAuth routes (more permissive for auth flows)
app.use('/login', security.middleware.oauth);
app.use('/login/callback', security.middleware.oauth);

// API endpoints
app.use('/api/search', security.middleware.api.search);
app.use('/api/save', security.middleware.api.save);
app.use('/api/getConfig', security.middleware.api.config);

// Auto-detection middleware
app.use(security.middleware.auto);
```

### Custom Middleware Creation

```javascript
// Create custom middleware
const customSecurity = security.createMiddleware('oauth');

// With options
const customWithOptions = security.middleware.create('api', {
    enableFallback: true,
    logErrors: true
});
```

### Authentication Operations

```javascript
const { auth } = require('./security');

// JWT operations
const payload = auth.jwt.createSessionPayload(tokens, userId, true);
const token = auth.jwt.generateToken(payload);
const decoded = auth.jwt.verifyToken(token);

// OAuth state tokens
const stateToken = auth.jwt.createStateToken(state);
const verifiedState = auth.jwt.verifyStateToken(stateToken);

// Convenience methods
const isLoggedIn = auth.isUserLoggedIn(authToken);
const user = auth.validateUserSession(authToken);
```

### Content Security Policy

```javascript
const { headers } = require('./security');

// Create CSP configuration
const cspConfig = headers.csp.create('oauth');
const cspHeader = headers.csp.createHeader('standard');

// Validate CSP
const isValid = headers.csp.validate(cspHeaderString);
```

## Security Features

### Content Security Policy
- Tailored for Spotify OAuth integration
- Allows required external resources (TypeKit, CDNJS, Google Fonts)
- Separate configurations for OAuth vs standard routes
- Validates against known requirements

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security (production only)
- Comprehensive Content Security Policy

### Authentication
- JWT-based session management
- Spotify OAuth integration
- State token validation for CSRF protection
- Token refresh handling

### Error Handling
- Graceful fallback when Helmet.js fails
- Manual header implementation as backup
- Minimal headers as last resort
- Comprehensive error logging

## External Resources Allowed

### Fonts & Stylesheets
- `fonts.googleapis.com` - Google Fonts CSS
- `fonts.gstatic.com` - Google Fonts files
- `use.typekit.net` - Adobe TypeKit
- `p.typekit.net` - TypeKit processing
- `cdnjs.cloudflare.com` - CDN resources

### Spotify Integration
- `accounts.spotify.com` - OAuth authentication
- `api.spotify.com` - Spotify Web API
- `*.scdn.co` - Spotify image CDN
- `*.spotifycdn.com` - Spotify CDN resources

## Environment Configuration

### Development
- More permissive CSP
- Debug logging enabled
- No HTTPS enforcement

### Production
- Strict security headers
- HTTPS enforcement
- Error logging only
- Optimized for performance

## Testing

```bash
# Run all security tests
node security/tests

# Quick validation
node security/tests --quick

# Individual tests
const tests = require('./security/tests');
tests.runQuick();
```

## Migration from Old Structure

The security module has been refactored for better organization:

```javascript
// Old way
const { securityMiddleware } = require('./security/middleware');
const jwtService = require('./security/jwt');

// New way
const { middleware, auth } = require('./security');
// or
const security = require('./security');
```

## Serverless Compatibility

This security system is optimized for Vercel serverless functions:

- No persistent state or background processes
- Lightweight configuration for fast cold starts
- Fallback mechanisms for reliability
- Environment-aware configurations

## Performance Considerations

- Pre-configured middleware instances are cached
- Minimal overhead for header setting
- Efficient CSP generation
- Graceful degradation on errors

## Troubleshooting

### CSP Violations
1. Check browser console for blocked resources
2. Add required domains to `headers/csp.js`
3. Test with `security/tests/testCSP.js`

### Authentication Issues
1. Verify JWT secret is set in environment
2. Check token expiration times
3. Validate OAuth configuration

### Header Problems
1. Check server logs for Helmet errors
2. Verify fallback headers are applied
3. Use manual middleware if needed

## Development

When adding new external resources:

1. Add domains to `headers/csp.js`
2. Update both standard and OAuth configurations
3. Test with CSP validation
4. Update documentation

The security module is designed to be maintainable, testable, and easy to extend while providing robust protection for the application.