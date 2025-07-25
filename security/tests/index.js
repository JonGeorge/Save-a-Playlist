/**
 * Security Test Suite
 * 
 * Comprehensive testing for all security components including
 * headers, CSP, authentication, and middleware functionality.
 */

const { testHelmetHeaders, testIntegratedMiddleware, testSpotifyCompatibility } = require('./helmetTest');
const { validateCSP } = require('../headers/csp');
const { validateSecurityHeaders } = require('../headers/manual');

/**
 * Runs all security tests
 */
function runAllSecurityTests() {
    console.log('🔒 Running Complete Security Test Suite\n');
    console.log('=' .repeat(50));
    
    const results = {
        passed: 0,
        failed: 0,
        warnings: 0
    };
    
    try {
        // Header tests
        console.log('\n📋 Testing Security Headers...');
        testHelmetHeaders();
        results.passed++;
        
        // Middleware integration tests  
        console.log('\n🔧 Testing Middleware Integration...');
        testIntegratedMiddleware();
        results.passed++;
        
        // Spotify compatibility tests
        console.log('\n🎵 Testing Spotify Compatibility...');
        testSpotifyCompatibility();
        results.passed++;
        
        console.log('\n✅ All security tests completed successfully!');
        console.log(`Results: ${results.passed} passed, ${results.failed} failed, ${results.warnings} warnings`);
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Security test suite failed:', error.message);
        results.failed++;
        return false;
    }
}

/**
 * Runs quick smoke tests for critical security features
 */
function runQuickSecurityCheck() {
    console.log('⚡ Running Quick Security Check...\n');
    
    try {
        // Test CSP generation
        const { createCSPHeaderString } = require('../headers/csp');
        const csp = createCSPHeaderString('standard');
        
        if (!validateCSP(csp)) {
            console.warn('⚠️ CSP validation warnings detected');
        } else {
            console.log('✅ CSP validation passed');
        }
        
        // Test auth module loading
        const authService = require('../auth');
        if (authService && authService.jwt && authService.oauth) {
            console.log('✅ Authentication modules loaded successfully');
        } else {
            throw new Error('Authentication modules failed to load');
        }
        
        // Test middleware creation
        const { createSecurityMiddleware } = require('../middleware');
        const middleware = createSecurityMiddleware('standard');
        if (typeof middleware === 'function') {
            console.log('✅ Security middleware created successfully');
        } else {
            throw new Error('Failed to create security middleware');
        }
        
        console.log('\n✅ Quick security check passed!');
        return true;
        
    } catch (error) {
        console.error('\n❌ Quick security check failed:', error.message);
        return false;
    }
}

/**
 * Individual test functions for specific components
 */
const tests = {
    headers: testHelmetHeaders,
    middleware: testIntegratedMiddleware,
    spotify: testSpotifyCompatibility,
    csp: () => {
        const { createCSPHeaderString } = require('../headers/csp');
        const csp = createCSPHeaderString('standard');
        return validateCSP(csp);
    }
};

module.exports = {
    runAllSecurityTests,
    runQuickSecurityCheck,
    tests
};

// Run tests if this file is executed directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--quick')) {
        runQuickSecurityCheck();
    } else {
        runAllSecurityTests();
    }
}
