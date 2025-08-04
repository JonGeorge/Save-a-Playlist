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
        // Try to notify parent window and close popup
        try {
            if (window.opener && !window.opener.closed) {
                // Set a flag that parent can check
                window.name = 'spotify-login-success';

                // Try to call parent function if available
                if (window.opener.spotifyLoginSuccess) {
                    window.opener.spotifyLoginSuccess();
                }

                // Also try to trigger a storage event for cross-tab communication
                localStorage.setItem('spotify-login-success', Date.now().toString());
            }
        } catch (e) {
            console.log('Could not communicate with parent window:', e);
        }

        // Close the window after a delay
        setTimeout(function() {
            window.close();
        }, 700);
    </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(successHtml);
    });
};
