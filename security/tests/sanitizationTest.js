/**
 * Test suite for input sanitization and validation
 * Verifies protection against XSS, injection attacks, and malformed data
 */

const { validate, sanitize, process } = require('../sanitization');

/**
 * Test cases for validation
 */
const validationTests = [
    // Search query tests
    {
        name: 'Valid search query',
        func: validate.searchQuery,
        input: 'Taylor Swift',
        expected: { isValid: true, errors: [] }
    },
    {
        name: 'Empty search query',
        func: validate.searchQuery,
        input: '',
        expected: { isValid: false, errors: ['Search query cannot be empty'] }
    },
    {
        name: 'Search query with XSS attempt',
        func: validate.searchQuery,
        input: '<script>alert("xss")</script>',
        expected: { isValid: false, errors: ['Search query contains potentially dangerous characters'] }
    },
    {
        name: 'Search query too long',
        func: validate.searchQuery,
        input: 'a'.repeat(201),
        options: { maxLength: 200 },
        expected: { isValid: false, errors: ['Search query cannot exceed 200 characters'] }
    },

    // Playlist name tests
    {
        name: 'Valid playlist name',
        func: validate.playlistName,
        input: 'My Awesome Playlist',
        expected: { isValid: true, errors: [] }
    },
    {
        name: 'Playlist name with script injection',
        func: validate.playlistName,
        input: 'Playlist<script>alert(1)</script>',
        expected: { isValid: false, errors: ['Playlist name contains potentially dangerous characters'] }
    },

    // URL tests
    {
        name: 'Valid HTTPS URL',
        func: validate.url,
        input: 'https://api.spotify.com/v1/playlists/123/tracks',
        expected: { isValid: true, errors: [] }
    },
    {
        name: 'Invalid URL format',
        func: validate.url,
        input: 'not-a-url',
        expected: { isValid: false, errors: ['Invalid URL format'] }
    },
    {
        name: 'JavaScript protocol URL',
        func: validate.url,
        input: 'javascript:alert(1)',
        expected: { isValid: false, errors: ['URL must use HTTP or HTTPS protocol'] }
    },
    {
        name: 'Non-Spotify URL when Spotify required',
        func: validate.url,
        input: 'https://example.com',
        options: { requireSpotify: true },
        expected: { isValid: false, errors: ['URL must be from Spotify domain'] }
    },

    // Boolean tests
    {
        name: 'Valid boolean true',
        func: validate.boolean,
        input: true,
        expected: { isValid: true, errors: [] }
    },
    {
        name: 'Valid boolean string',
        func: validate.boolean,
        input: 'false',
        expected: { isValid: true, errors: [] }
    },
    {
        name: 'Invalid boolean',
        func: validate.boolean,
        input: 'maybe',
        expected: { isValid: false, errors: ['Value must be a boolean or boolean string'] }
    },

    // JWT token tests
    {
        name: 'Valid JWT format',
        func: validate.jwtToken,
        input: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ',
        expected: { isValid: true, errors: [] }
    },
    {
        name: 'Invalid JWT format',
        func: validate.jwtToken,
        input: 'invalid.jwt',
        expected: { isValid: false, errors: ['Invalid JWT token format'] }
    }
];

/**
 * Test cases for sanitization
 */
const sanitizationTests = [
    // HTML escaping tests
    {
        name: 'Escape HTML characters',
        func: sanitize.escapeHtml,
        input: '<script>alert("xss")</script>',
        expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    },

    // HTML stripping tests
    {
        name: 'Strip HTML tags',
        func: sanitize.stripHtml,
        input: '<p>Hello <strong>world</strong></p>',
        expected: 'Hello world'
    },
    {
        name: 'Strip script tags',
        func: sanitize.stripHtml,
        input: 'Hello<script>alert(1)</script>world',
        expected: 'Helloworld'
    },

    // JavaScript removal tests
    {
        name: 'Remove JavaScript protocols',
        func: sanitize.removeJavaScript,
        input: 'javascript:alert(1)',
        expected: ''
    },
    {
        name: 'Remove event handlers',
        func: sanitize.removeJavaScript,
        input: '<div onclick="alert(1)">Click me</div>',
        expected: '<div>Click me</div>'
    },

    // Whitespace cleaning tests
    {
        name: 'Clean multiple spaces',
        func: sanitize.cleanWhitespace,
        input: 'Hello    world   test',
        expected: 'Hello world test'
    },
    {
        name: 'Remove control characters',
        func: sanitize.cleanWhitespace,
        input: 'Hello\x00\x01world',
        expected: 'Helloworld'
    },

    // Search query sanitization
    {
        name: 'Sanitize search query with HTML',
        func: sanitize.searchQuery,
        input: '<script>alert("search")</script>Taylor Swift',
        expected: 'Taylor Swift'
    },

    // Playlist name sanitization
    {
        name: 'Sanitize playlist name',
        func: sanitize.playlistName,
        input: 'My <em>Awesome</em> Playlist',
        expected: 'My Awesome Playlist'
    },

    // URL sanitization
    {
        name: 'Sanitize malicious URL',
        func: sanitize.url,
        input: 'javascript:alert(1)',
        expected: 'http:alert(1)'
    },

    // Text sanitization
    {
        name: 'Sanitize general text',
        func: sanitize.text,
        input: '<script>alert("test")</script>Hello world',
        expected: 'Hello world'
    },

    // Filename sanitization
    {
        name: 'Sanitize filename',
        func: sanitize.filename,
        input: 'my<file>name?.txt',
        expected: 'myfilename.txt'
    }
];

/**
 * Test cases for combined processing
 */
const processingTests = [
    {
        name: 'Process valid search query',
        func: process.searchQuery,
        input: 'Taylor Swift',
        expected: { isValid: true, sanitized: 'Taylor Swift', errors: [] }
    },
    {
        name: 'Process invalid search query',
        func: process.searchQuery,
        input: '<script>alert(1)</script>',
        expected: { isValid: false, errors: ['Search query contains potentially dangerous characters'] }
    },
    {
        name: 'Process valid playlist name',
        func: process.playlistName,
        input: 'My Playlist',
        expected: { isValid: true, sanitized: 'My Playlist', errors: [] }
    },
    {
        name: 'Process valid URL',
        func: process.url,
        input: 'https://api.spotify.com/test',
        expected: { isValid: true, sanitized: 'https://api.spotify.com/test', errors: [] }
    }
];

/**
 * Run validation tests
 */
function runValidationTests() {
    console.log('🔍 Running Validation Tests\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const test of validationTests) {
        try {
            const result = test.options ? 
                test.func(test.input, test.options) : 
                test.func(test.input);
            
            const success = result.isValid === test.expected.isValid;
            
            if (success) {
                console.log(`✓ ${test.name}`);
                passed++;
            } else {
                console.log(`✗ ${test.name}`);
                console.log(`  Expected: ${JSON.stringify(test.expected)}`);
                console.log(`  Got: ${JSON.stringify(result)}`);
                failed++;
            }
        } catch (error) {
            console.log(`✗ ${test.name} (Error: ${error.message})`);
            failed++;
        }
    }
    
    console.log(`\nValidation Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };
}

/**
 * Run sanitization tests
 */
function runSanitizationTests() {
    console.log('🧹 Running Sanitization Tests\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const test of sanitizationTests) {
        try {
            const result = test.func(test.input);
            
            if (result === test.expected) {
                console.log(`✓ ${test.name}`);
                passed++;
            } else {
                console.log(`✗ ${test.name}`);
                console.log(`  Expected: "${test.expected}"`);
                console.log(`  Got: "${result}"`);
                failed++;
            }
        } catch (error) {
            console.log(`✗ ${test.name} (Error: ${error.message})`);
            failed++;
        }
    }
    
    console.log(`\nSanitization Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };
}

/**
 * Run processing tests
 */
function runProcessingTests() {
    console.log('⚙️ Running Processing Tests\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const test of processingTests) {
        try {
            const result = test.func(test.input);
            
            const success = result.isValid === test.expected.isValid &&
                           (!result.isValid || result.sanitized === test.expected.sanitized);
            
            if (success) {
                console.log(`✓ ${test.name}`);
                passed++;
            } else {
                console.log(`✗ ${test.name}`);
                console.log(`  Expected: ${JSON.stringify(test.expected)}`);
                console.log(`  Got: ${JSON.stringify(result)}`);
                failed++;
            }
        } catch (error) {
            console.log(`✗ ${test.name} (Error: ${error.message})`);
            failed++;
        }
    }
    
    console.log(`\nProcessing Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };
}

/**
 * Run all sanitization tests
 */
function runAllTests() {
    console.log('🛡️ Input Sanitization & Validation Tests\n');
    console.log('==========================================\n');
    
    const validation = runValidationTests();
    const sanitization = runSanitizationTests();
    const processing = runProcessingTests();
    
    const totalPassed = validation.passed + sanitization.passed + processing.passed;
    const totalFailed = validation.failed + sanitization.failed + processing.failed;
    const totalTests = totalPassed + totalFailed;
    
    console.log('📊 Final Results');
    console.log('================');
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
        console.log('\n✅ All sanitization tests passed!');
    } else {
        console.log(`\n❌ ${totalFailed} test(s) failed`);
    }
    
    return { totalPassed, totalFailed, totalTests };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runValidationTests,
    runSanitizationTests,
    runProcessingTests,
    runAllTests,
    validationTests,
    sanitizationTests,
    processingTests
};