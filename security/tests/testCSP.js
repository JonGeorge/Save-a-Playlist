/**
 * Test to verify CSP includes required external domains
 */

const { createStandardHelmet } = require('../headers/helmet');

const req = { headers: { host: 'localhost:3000' }, path: '/test' };
const res = {
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

console.log('Testing CSP for external resources...\n');

const middleware = createStandardHelmet();
middleware(req, res, () => {
    const csp = res.headers['Content-Security-Policy'];
    
    console.log('Content Security Policy:');
    console.log(csp);
    console.log('\n');
    
    // Check for required domains and patterns
    const requiredDomains = [
        { pattern: '*.typekit.net', description: 'TypeKit domains (wildcard)' },
        { pattern: 'cdnjs.cloudflare.com', description: 'CDNJS' },
        { pattern: 'fonts.googleapis.com', description: 'Google Fonts CSS' },
        { pattern: 'fonts.gstatic.com', description: 'Google Fonts files' }
    ];
    
    console.log('Domain Check:');
    requiredDomains.forEach(({ pattern, description }) => {
        if (csp.includes(pattern)) {
            console.log(`✅ ${description} - ALLOWED`);
        } else {
            console.log(`❌ ${description} - BLOCKED`);
        }
    });
    
    // Check specific directives
    console.log('\nDirective Check:');
    if (csp.includes('style-src') && csp.includes('*.typekit.net') && csp.includes('cdnjs.cloudflare.com')) {
        console.log('✅ style-src includes TypeKit wildcard and CDNJS');
    } else {
        console.log('❌ style-src missing required domains');
    }
    
    if (csp.includes('font-src') && csp.includes('*.typekit.net') && csp.includes('cdnjs.cloudflare.com')) {
        console.log('✅ font-src includes TypeKit wildcard and CDNJS');
    } else {
        console.log('❌ font-src missing required domains');
    }
});

console.log('\n✅ CSP test completed');
