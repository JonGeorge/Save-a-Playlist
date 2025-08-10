# Authentication & Security Guide

## Overview

Save a Playlist uses Spotify OAuth 2.0 for authentication with additional security measures including JWT tokens, CSRF protection, and secure cookie handling. This guide explains the complete authentication flow and security implementation.

## Spotify OAuth 2.0 Flow

### 1. Authentication Initiation

When a user clicks "Connect to Spotify":

1. **Client Request**: User clicks login button (`public/login.js`)
2. **Popup Window**: Opens `/api/login` in a popup window
3. **Server Redirect**: Server generates OAuth URL with CSRF state token
4. **Spotify Authorization**: User authorizes the application on Spotify

```javascript
// Client-side login initiation
const openLoginWindow = function(url) {
    const newWindow = window.open(url, 'Spotify Login', 'toolbar=no, menubar=no, status=no, directories=no, height=750, width=600');
    // ... detection methods
};
```

### 2. OAuth Parameters

**Authorization Request** (`/api/login`):
```
https://accounts.spotify.com/authorize?
  response_type=code&
  client_id={SPOTIFY_CLIENT_ID}&
  scope=playlist-modify-public playlist-modify-private&
  redirect_uri={REDIRECT_URI}&
  state={CSRF_TOKEN}
```

**Required Scopes**:
- `playlist-modify-public`: Create and modify public playlists
- `playlist-modify-private`: Create and modify private playlists

### 3. Callback Handling

After user authorization, Spotify redirects to `/api/login/callback`:

```javascript
// Server-side callback handling (api/login/callback.js)
const requestState = url.searchParams.get('state');
const requestCode = url.searchParams.get('code');

// Verify CSRF state token
const stateToken = cookies.oauth_state;
const storedState = auth.jwt.verifyStateToken(stateToken);

if (storedState !== requestState) {
    // CSRF attack detected - redirect to error page
    res.redirect('/error');
    return;
}
```

### 4. Token Exchange

Exchange authorization code for access tokens:

```javascript
// Get tokens from Spotify
const tokens = await auth.authorizationCode.getAuthorizationCodeTokens(requestCode, host);

// Create JWT payload
const payload = auth.jwt.createSessionPayload(tokens, tokens.user_id, true);
const authToken = auth.jwt.generateToken(payload);
```

### 5. Session Creation

Set secure authentication cookie:

```javascript
// JWT cookie configuration
const authCookieOptions = [
    `auth_token=${authToken}`,
    'HttpOnly',           // Prevent XSS access
    'Max-Age=3600',      // 1 hour expiration
    'Path=/',
    process.env.NODE_ENV === 'production' ? 'Secure' : '', // HTTPS only in production
    'SameSite=Lax'       // CSRF protection
].filter(Boolean).join('; ');

res.setHeader('Set-Cookie', authCookieOptions);
```

## JWT Implementation

### Token Structure

JWT payload contains:
```json
{
  "access_token": "BQA...",
  "refresh_token": "AQD...",
  "user_id": "spotify_user_id",
  "expires_at": 1640995200,
  "iat": 1640991600,
  "exp": 1640995200
}
```

### Token Validation

```javascript
// JWT validation (security/auth/jwt.js)
const jwt = require('jsonwebtoken');

function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null; // Invalid token
    }
}
```

### Token Refresh

Tokens are automatically refreshed when needed:

```javascript
// Automatic token refresh
if (isTokenExpired(payload)) {
    const newTokens = await refreshAccessToken(payload.refresh_token);
    // Update JWT with new tokens
}
```

## Client-Side Authentication State

### State Management

Authentication state is managed client-side through:

1. **Initial State**: Loaded via `appConfig.js` on page load
2. **Login Detection**: Multiple methods detect successful login
3. **State Caching**: 30-minute cache reduces server calls

```javascript
// Auth state caching (public/authPoller.js)
function checkAuthStatus() {
    const now = Date.now();
    const cacheAge = 30 * 60 * 1000; // 30 minutes
    
    // Use cached state if recent
    if (window.config && window.authStateTimestamp && (now - window.authStateTimestamp) < cacheAge) {
        return Promise.resolve(window.config.isLoggedIn);
    }
    
    // Fetch fresh state from server
    return fetch('/api/getConfig')...
}
```

### Login Success Detection

**Centralized Authentication System**: All authentication state changes are handled by a single centralized system in `authPoller.js` to prevent race conditions and duplicate processing.

**Challenge**: OAuth redirects through Spotify break the `window.opener` relationship, making traditional popup communication methods unreliable.

**Solution**: Multiple redundant detection methods with duplicate prevention:

1. **localStorage Events**: Primary detection method (global listener)
2. **localStorage Polling**: Popup-specific detection during window lifecycle  
3. **Window Name Detection**: Fallback using window reference
4. **Server Polling**: Last resort when other methods fail

```javascript
// Centralized handler (public/authPoller.js)
function handleLoginSuccess(context = 'unknown') {
    // Prevent duplicate processing
    if (loginSuccessProcessed) {
        console.log('Login success already processed, ignoring duplicate from:', context);
        return;
    }
    loginSuccessProcessed = true;
    
    // Handle login success once
    updateUI();
    checkAuthStatus(); // Verify with server
}

// Global localStorage event listener
window.addEventListener('storage', function(e) {
    if (e.key === 'spotify-login-success') {
        handleLoginSuccess('localStorage-event');
    }
});

// Popup window detection (public/login.js)
// Method 1: localStorage polling while popup is open
const loginSuccess = localStorage.getItem('spotify-login-success');
if (loginSuccess && !window.loginState.completed) {
    window.authPoller.handleLoginSuccess('popup-localStorage-polling');
}

// Method 2: Window name detection
if (newWindow.name === 'spotify-login-success') {
    window.authPoller.handleLoginSuccess('popup-windowName');
}

// Method 3: localStorage check when popup closes
if (loginSuccess && loginTimestamp && (now - parseInt(loginTimestamp)) < 60000) {
    window.authPoller.handleLoginSuccess('popup-localStorage-closed');
}
```

**Success Page Communication** (`/api/success.js`):
```javascript
// Since window.opener is null due to OAuth redirects, use alternative methods:

// Method 1: Set window name for parent to detect
window.name = 'spotify-login-success';

// Method 2: Set localStorage flags with timestamps
localStorage.setItem('spotify-login-success', timestamp);
localStorage.setItem('spotify-login-timestamp', timestamp);

// Method 3: Document title as additional signal
document.title = 'Spotify Login Success - ' + Date.now();
```

## Security Measures

### CSRF Protection

**State Token Generation**:
```javascript
// Generate cryptographically secure state token
const stateToken = auth.jwt.generateStateToken();

// Store in secure cookie (2 minutes expiration for security)
res.setHeader('Set-Cookie', `oauth_state=${stateToken}; HttpOnly; Max-Age=120; Path=/`);
```

**State Validation**:
```javascript
// Verify state token matches
const storedState = auth.jwt.verifyStateToken(stateToken);
if (storedState !== requestState) {
    throw new Error('CSRF token mismatch');
}
```

**OAuth State Cleanup**:
For serverless applications, OAuth state cookies are cleaned up through multiple mechanisms:

1. **Successful Login**: Cookie cleared by callback endpoint
2. **Abandoned Login**: Endpoint `/api/clearOAuthState` called when popup closes
3. **Automatic Expiration**: 2-minute expiration as security fallback

```javascript
// Client-side cleanup when popup closes without login (public/login.js)
function clearOAuthState() {
    fetch('/api/clearOAuthState', { 
        method: 'POST',
        credentials: 'include' 
    });
}

// Server-side cleanup endpoint (api/clearOAuthState.js)
res.setHeader('Set-Cookie', 'oauth_state=; HttpOnly; Max-Age=0; Path=/');
```

### Cookie Security

**Production Configuration**:
- `HttpOnly`: Prevents XSS access to tokens
- `Secure`: HTTPS-only transmission
- `SameSite=Lax`: CSRF protection while allowing OAuth redirects
- `Max-Age=3600`: 1-hour expiration

**Development Configuration**:
- Same as production except `Secure` flag omitted for HTTP testing

### Rate Limiting

```javascript
// Rate limiting per endpoint
const rateLimits = {
    '/api/search': { requests: 100, window: 60000 },    // 100/min
    '/api/save': { requests: 10, window: 60000 },       // 10/min
    '/api/login': { requests: 5, window: 300000 }       // 5/5min
};
```

### Input Validation

All endpoints validate:
- Parameter presence and types
- Playlist ID format
- Search query length and content
- JWT token structure and signature

### Error Handling

**Secure Error Responses**:
```javascript
// Don't expose internal details
{
    "error": "Authentication failed",
    "code": "INVALID_TOKEN"
    // No stack traces or internal paths
}
```

## Environment Variables

Required environment variables:

```bash
# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# JWT Security
JWT_SECRET=your_jwt_secret_key_32_chars_minimum

# Application
NODE_ENV=production
PROTOCOL=https://
```

## Security Best Practices

### Token Management
- JWT secret must be at least 32 characters
- Tokens expire after 1 hour
- Refresh tokens used for automatic renewal
- No sensitive data stored client-side

### Cookie Security
- Always use `HttpOnly` for auth cookies
- Enable `Secure` flag in production
- Set appropriate `SameSite` policy
- Implement proper expiration

### Error Handling
- Never expose internal error details
- Log security events for monitoring
- Implement proper rate limiting
- Validate all inputs server-side

### HTTPS Requirements
- Production must use HTTPS
- Secure cookies require HTTPS
- OAuth redirects validated against HTTPS URLs

## Troubleshooting

### Common Issues

**Login Popup Blocked**:
- Ensure popup is triggered by user action
- Check browser popup blocking settings

**Login Success Not Detected**:
- Check browser console for detection method logs
- Verify localStorage is accessible (not in private/incognito mode)
- Ensure popup closes after 3 seconds (success page timeout)
- Look for "window.opener exists: false" indicating OAuth redirect issue

**Duplicate "Connected to Spotify" Messages**:
- This indicates multiple detection methods firing
- Check for "Login success already processed" log messages
- Ensure `loginSuccessProcessed` flag is working properly

**OAuth State Cookie Issues**:
- Cookie expires after 2 minutes for security
- Abandoned logins automatically trigger cleanup
- Check `/api/clearOAuthState` endpoint availability

**CSRF Token Mismatch**:
- Verify system clock synchronization
- Check cookie domain configuration
- Ensure state token hasn't expired (2-minute window)

**JWT Verification Failed**:
- Confirm JWT_SECRET environment variable
- Check token expiration
- Validate token structure

**Excessive Server Polling**:
- Should only occur if localStorage detection fails
- Check for "Popup closed, starting direct auth polling" messages
- Verify localStorage events are working properly

**OAuth Redirect Mismatch**:
- Verify Spotify app redirect URI configuration
- Check HTTPS vs HTTP protocol
- Confirm domain matches exactly

### Debugging Authentication

Enable debug logging:
```bash
DEBUG=true node server.js
```

Check authentication flow:
1. Verify OAuth state generation
2. Confirm Spotify callback receipt
3. Validate JWT creation and storage
4. Test cookie transmission
5. Verify client-side state detection