/**
 * Test suite for Helmet security headers integration
 * Verifies that security headers are properly set without breaking functionality
 */

const { createStandardHelmet, createOAuthHelmet } = require('../headers/helmet');
const { middleware: securityMiddleware } = require('../index');

/**
 * Mock request and response objects for testing
 */
function createMockRequest(options = {}) {
    return {
        headers: {
            'x-forwarded-for': '127.0.0.1',
            host: 'localhost:3000',
            ...options.headers
        },
        connection: { remoteAddress: '127.0.0.1' },
        path: options.path || '/test',
        url: options.url || '/test',
        method: options.method || 'GET'
    };
}

function createMockResponse() {
    const headers = {};
    return {
        headers,
        statusCode: 200,
        setHeader: function(name, value) {
            this.headers[name] = value;
        },
        removeHeader: function(name) {
            delete this.headers[name];
        },
        getHeader: function(name) {
            return this.headers[name];
        },
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.body = data;
            return this;
        },
        send: function(data) {
            this.body = data;
            return this;
        },
        redirect: function(url) {
            this.statusCode = 302;
            this.headers['Location'] = url;
            return this;
        }
    };
}

/**
 * Test Helmet security headers
 */
function testHelmetHeaders() {
    console.log('Testing Helmet Security Headers...\n');

    // Test 1: Basic security headers
    console.log('Test 1: Basic security headers');
    const middleware = createStandardHelmet();
    const req = createMockRequest();
    const res = createMockResponse();

    middleware(req, res, () => {
        const expectedHeaders = [
            'X-Content-Type-Options',
            'X-Frame-Options', 
            'X-XSS-Protection',
            'Referrer-Policy'
        ];

        let allHeadersPresent = true;
        for (const header of expectedHeaders) {
            if (!res.headers[header]) {
                console.log(`✗ Missing security header: ${header}`);
                allHeadersPresent = false;
            }
        }

        if (allHeadersPresent) {
            console.log('✓ All basic security headers are set');
            console.log(`  - X-Content-Type-Options: ${res.headers['X-Content-Type-Options']}`);
            console.log(`  - X-Frame-Options: ${res.headers['X-Frame-Options']}`);
            console.log(`  - X-XSS-Protection: ${res.headers['X-XSS-Protection']}`);
            console.log(`  - Referrer-Policy: ${res.headers['Referrer-Policy']}`);
        }
    });

    // Test 2: Content Security Policy
    console.log('\nTest 2: Content Security Policy');
    const cspHeader = res.headers['Content-Security-Policy'];
    if (cspHeader) {
        console.log('✓ Content Security Policy header is set');
        
        // Check for Spotify domains
        const spotifyDomains = [
            'accounts.spotify.com',
            'api.spotify.com',
            'i.scdn.co'
        ];
        
        let spotifyDomainsAllowed = true;
        for (const domain of spotifyDomains) {
            if (!cspHeader.includes(domain)) {
                console.log(`✗ CSP missing Spotify domain: ${domain}`);
                spotifyDomainsAllowed = false;
            }
        }
        
        if (spotifyDomainsAllowed) {
            console.log('✓ All required Spotify domains are allowed in CSP');
        }
    } else {
        console.log('✗ Content Security Policy header is missing');
    }

    // Test 3: OAuth-specific headers
    console.log('\nTest 3: OAuth-specific security headers');
    const oauthMiddleware = createOAuthHelmet();
    const oauthReq = createMockRequest({ path: '/login' });
    const oauthRes = createMockResponse();

    oauthMiddleware(oauthReq, oauthRes, () => {
        const oauthCsp = oauthRes.headers['Content-Security-Policy'];
        if (oauthCsp && oauthCsp.includes('*.spotify.com')) {
            console.log('✓ OAuth middleware allows broader Spotify domains');
        } else {
            console.log('✗ OAuth middleware should allow broader Spotify domains');
        }
    });
}

/**
 * Test integrated security middleware
 */
function testIntegratedMiddleware() {
    console.log('\nTesting Integrated Security Middleware...\n');

    // Test different route types
    const testCases = [
        { type: 'pages', path: '/', description: 'Homepage' },
        { type: 'oauth', path: '/login', description: 'OAuth login' },
        { type: 'api.search', path: '/api/search', description: 'Search API' },
        { type: 'api.save', path: '/api/save', description: 'Save API' },
        { type: 'api.config', path: '/api/getConfig', description: 'Config API' }
    ];

    for (const testCase of testCases) {
        console.log(`Test: ${testCase.description} (${testCase.path})`);
        
        const req = createMockRequest({ path: testCase.path });
        const res = createMockResponse();
        
        // Get the appropriate middleware
        let middleware;
        if (testCase.type.includes('.')) {
            const [main, sub] = testCase.type.split('.');
            middleware = securityMiddleware[main][sub];
        } else {
            middleware = securityMiddleware[testCase.type];
        }

        if (middleware) {
            let middlewareCompleted = false;
            let errorOccurred = false;

            middleware(req, res, (err) => {
                if (err) {
                    errorOccurred = true;
                    console.log(`✗ Middleware error: ${err.message}`);
                } else {
                    middlewareCompleted = true;
                }
            });

            // Note: Rate limiting removed for serverless compatibility
            console.log('ℹ Rate limiting not tested (removed for serverless compatibility)');

            // Check for security headers
            if (res.headers['X-Content-Type-Options']) {
                console.log('✓ Security headers are applied');
            }

            if (!errorOccurred) {
                console.log('✓ Middleware executed without errors');
            }
        } else {
            console.log('✗ Middleware not found');
        }
        
        console.log('');
    }
}

/**
 * Test Spotify OAuth compatibility
 */
function testSpotifyCompatibility() {
    console.log('Testing Spotify OAuth Compatibility...\n');

    // Test OAuth redirect scenario
    console.log('Test: OAuth redirect compatibility');
    const oauthReq = createMockRequest({
        path: '/login/callback',
        url: '/login/callback?code=test&state=test'
    });
    const oauthRes = createMockResponse();

    const oauthMiddleware = securityMiddleware.oauth;
    
    oauthMiddleware(oauthReq, oauthRes, () => {
        // Check that CSP allows Spotify domains
        const csp = oauthRes.headers['Content-Security-Policy'];
        if (csp) {
            const allowsSpotify = csp.includes('accounts.spotify.com');
            if (allowsSpotify) {
                console.log('✓ CSP allows Spotify OAuth domains');
            } else {
                console.log('✗ CSP should allow Spotify OAuth domains');
            }
        }

        // Check that frame options don't block OAuth
        const frameOptions = oauthRes.headers['X-Frame-Options'];
        if (frameOptions === 'SAMEORIGIN' || frameOptions === 'DENY') {
            console.log(`✓ Frame options set appropriately: ${frameOptions}`);
        }
    });
}

/**
 * Run all tests
 */
function runAllTests() {
    console.log('🔒 Helmet Security Integration Tests\n');
    console.log('====================================\n');

    try {
        testHelmetHeaders();
        testIntegratedMiddleware();
        testSpotifyCompatibility();
        
        console.log('\n✅ All Helmet integration tests completed');
        console.log('\nNote: These tests verify header configuration.');
        console.log('Full functionality testing requires running the application.');
    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testHelmetHeaders,
    testIntegratedMiddleware,
    testSpotifyCompatibility,
    runAllTests
};
