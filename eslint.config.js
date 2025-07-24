const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Node.js globals
                global: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'writable',
                module: 'readonly',
                require: 'readonly',
                console: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                // Browser globals for frontend files
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                XMLHttpRequest: 'readonly',
                fetch: 'readonly'
            }
        },
        rules: {
            // Error prevention
            'no-console': 'off', // Allow console in this project
            'no-unused-vars': ['error', { 
                'argsIgnorePattern': '^(_|e$|error$|event$|response$|btn$)', 
                'varsIgnorePattern': '^(_|playlistApi$|playlistDomUtils$)',
                'caughtErrorsIgnorePattern': '^(e$|error$|_)'
            }],
            'no-undef': 'error',
            'no-redeclare': ['error', { 'builtinGlobals': false }],
            
            // Code quality
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all'],
            
            // Style consistency
            'indent': ['error', 4],
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            'semi': ['error', 'always'],
            'comma-dangle': ['error', 'never'],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            'eol-last': ['error', 'always'],
            
            // Best practices
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-return-assign': ['error', 'except-parens'],
            'no-self-compare': 'error',
            'no-throw-literal': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unused-expressions': 'error'
        },
        files: ['**/*.js'],
        ignores: [
            'node_modules/**',
            'public/build.txt',
            '**/*.min.js'
        ]
    },
    {
        // Specific config for Node.js serverless function files
        files: ['api/**/*.js', 'services/**/*.js', 'config/**/*.js', 'dao/**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                // Node.js specific globals
                global: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'writable',
                module: 'readonly',
                require: 'readonly',
                console: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly'
            }
        }
    },
    {
        // Specific config for browser frontend files
        files: ['public/**/*.js'],
        languageOptions: {
            sourceType: 'script',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                XMLHttpRequest: 'readonly',
                fetch: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                console: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                prompt: 'readonly',
                // Custom globals for this project (defined in other files)
                playlistApi: 'writable',
                playlistDomUtils: 'writable'
            }
        }
    }
];
