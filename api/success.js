const { middleware } = require('../security');

module.exports = async (req, res) => {
    return middleware.pages(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const successHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Login Successful</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #1db954;
            color: white;
        }
        .success-message {
            font-size: 24px;
            margin-bottom: 20px;
        }
        .closing-message {
            font-size: 16px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="success-message">✓ Successfully connected to Spotify!</div>
    <div class="closing-message">This window will close automatically...</div>
    <script>
        // console.log('Success page loaded - login completed successfully');

        // Since window.opener is null due to OAuth redirects, use alternative methods:

        // Method 1: Set window name for parent to detect
        window.name = 'spotify-login-success';
        // console.log('Set window.name to: spotify-login-success');

        // Method 2: Set localStorage flag with current timestamp
        try {
            const timestamp = Date.now().toString();
            localStorage.setItem('spotify-login-success', timestamp);
            localStorage.setItem('spotify-login-timestamp', timestamp);
            // console.log('Set localStorage flags for login success');
        } catch (e) {
            console.warn('Could not set localStorage:', e);
        }

        // Method 3: Use document.title as another signal
        document.title = 'Spotify Login Success - ' + Date.now();

        // Close the window after a longer delay to ensure parent can detect
        setTimeout(function() {
            // console.log('Closing popup window...');
            window.close();
        }, 700);
    </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(successHtml);
    });
};
