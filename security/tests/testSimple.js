/**
 * Simple test for the new Helmet configuration
 */

const { createStandardHelmet, createOAuthHelmet } = require('../headers/helmet');
const { createManualSecurityMiddleware } = require('../headers/manual');

// Mock request and response
const req = { headers: { host: 'localhost:3000' }, path: '/test' };
const res = {
    headers: {},
    setHeader: function(name, value) {
        this.headers[name] = value;
        console.log(`✓ Header set: ${name}`);
    },
    removeHeader: function(name) {
        delete this.headers[name];
    },
    getHeader: function(name) {
        return this.headers[name];
    }
};

console.log('Testing Basic Helmet Middleware...');
try {
    const basicMiddleware = createStandardHelmet();
    basicMiddleware(req, res, () => {
        console.log('✅ Basic middleware executed successfully');
        console.log('Headers set:', Object.keys(res.headers));
    });
} catch (error) {
    console.error('❌ Basic middleware failed:', error.message);
}

console.log('\nTesting OAuth Helmet Middleware...');
const res2 = {
    headers: {},
    setHeader: function(name, value) {
        this.headers[name] = value;
    },
    removeHeader: function(name) {
        delete this.headers[name];
    },
    getHeader: function(name) {
        return this.headers[name];
    }
};

try {
    const oauthMiddleware = createOAuthHelmet();
    oauthMiddleware(req, res2, () => {
        console.log('✅ OAuth middleware executed successfully');
        console.log('Headers set:', Object.keys(res2.headers));
    });
} catch (error) {
    console.error('❌ OAuth middleware failed:', error.message);
}

console.log('\nTesting Minimal Security Middleware...');
const res3 = {
    headers: {},
    setHeader: function(name, value) {
        this.headers[name] = value;
    }
};

try {
    const minimalMiddleware = createManualSecurityMiddleware();
    minimalMiddleware(req, res3, () => {
        console.log('✅ Minimal middleware executed successfully');
        console.log('Headers set:', Object.keys(res3.headers));
    });
} catch (error) {
    console.error('❌ Minimal middleware failed:', error.message);
}
