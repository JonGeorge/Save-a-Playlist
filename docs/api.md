# API Documentation

## Overview

Save a Playlist provides a REST API for searching Spotify playlists and saving them to a user's personal library. All endpoints require proper authentication where specified.

## Base URLs

- **Development**: `http://localhost:3001`
- **Production**: `https://saveaplaylist.com`

## Authentication

Most endpoints require authentication via JWT stored in an HTTP-only cookie named `auth_token`. Authentication is handled through Spotify OAuth 2.0.

### Headers
```
Cookie: auth_token=<jwt_token>
Content-Type: application/json (for POST requests)
```

## Endpoints

### 1. Search Playlists

Search for Spotify playlists by name.

**Endpoint**: `GET /api/search`

**Authentication**: Required

**Parameters**:
- `q` (string, required): Search query for playlist name
- `limit` (number, optional): Number of results to return (default: 7, max: 50)

**Example Request**:
```http
GET /api/search?q=chill%20vibes&limit=5
Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):
```json
{
  "playlists": {
    "items": [
      {
        "id": "37i9dQZF1DX0XUsuxWHRQd",
        "name": "Chill Vibes",
        "description": "Relax and unwind with these chill tracks",
        "owner": {
          "display_name": "Spotify",
          "id": "spotify"
        },
        "images": [
          {
            "url": "https://i.scdn.co/image/ab67706f00000003...",
            "height": 640,
            "width": 640
          }
        ],
        "tracks": {
          "total": 50
        },
        "external_urls": {
          "spotify": "https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd"
        }
      }
    ]
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `400 Bad Request`: Missing required parameters
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Spotify API error

---

### 2. Save Playlist

Save a Spotify playlist to the user's personal library.

**Endpoint**: `POST /api/save`

**Authentication**: Required

**Request Body**:
```json
{
  "playlistId": "37i9dQZF1DX0XUsuxWHRQd",
  "playlistName": "My Saved Chill Vibes"
}
```

**Parameters**:
- `playlistId` (string, required): Spotify playlist ID to save
- `playlistName` (string, required): Name for the new playlist in user's library

**Example Request**:
```http
POST /api/save
Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "playlistId": "37i9dQZF1DX0XUsuxWHRQd",
  "playlistName": "My Chill Collection"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "playlist": {
    "id": "3cEYpjA9oz9GiPac4AsH4n",
    "name": "My Chill Collection",
    "external_urls": {
      "spotify": "https://open.spotify.com/playlist/3cEYpjA9oz9GiPac4AsH4n"
    },
    "tracks_added": 50
  },
  "message": "Playlist saved successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `400 Bad Request`: Missing required parameters or invalid playlist ID
- `403 Forbidden`: Insufficient Spotify permissions
- `404 Not Found`: Playlist not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Failed to save playlist

---

### 3. Login

Initiate Spotify OAuth 2.0 authentication flow.

**Endpoint**: `GET /api/login`

**Authentication**: None

**Parameters**: None

**Response**: Redirects to Spotify authorization page

**Example Request**:
```http
GET /api/login
```

**Success Response**: `302 Redirect` to Spotify OAuth URL with state parameter

**Error Responses**:
- `500 Internal Server Error`: OAuth configuration error

---

### 4. OAuth Callback

Handle OAuth callback from Spotify and complete authentication.

**Endpoint**: `GET /api/login/callback`

**Authentication**: None (handles authentication)

**Parameters**:
- `code` (string, required): Authorization code from Spotify
- `state` (string, required): CSRF protection state parameter

**Example Request**:
```http
GET /api/login/callback?code=AQA1234...&state=abcd1234
```

**Success Response**: `302 Redirect` to `/success` with authentication cookie set

**Error Responses**:
- `400 Bad Request`: Missing or invalid parameters
- `401 Unauthorized`: State mismatch (CSRF protection)
- `500 Internal Server Error`: Token exchange failed

---

### 5. Success Page

Display login success confirmation and handle popup communication.

**Endpoint**: `GET /api/success`

**Authentication**: None

**Response**: HTML page with JavaScript for popup communication

---

### 6. Get Config

Retrieve application configuration and authentication status.

**Endpoint**: `GET /api/getConfig`

**Authentication**: Optional (returns different data based on auth status)

**Parameters**: None

**Example Request**:
```http
GET /api/getConfig
Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response - Authenticated** (200):
```json
{
  "isLoggedIn": true,
  "user": {
    "id": "user123",
    "display_name": "John Doe"
  },
  "search": {
    "typeAheadReturnCount": 7,
    "minimumCharsForTypeahead": 3
  }
}
```

**Success Response - Unauthenticated** (200):
```json
{
  "isLoggedIn": false,
  "search": {
    "typeAheadReturnCount": 7,
    "minimumCharsForTypeahead": 3
  }
}
```

**Error Responses**:
- `500 Internal Server Error`: Configuration error

## Error Format

All error responses follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)"
}
```

## Common Error Codes

- `INVALID_TOKEN`: JWT token is invalid or expired
- `MISSING_PARAMETERS`: Required parameters are missing
- `PLAYLIST_NOT_FOUND`: Specified playlist doesn't exist
- `INSUFFICIENT_PERMISSIONS`: User lacks required Spotify permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SPOTIFY_API_ERROR`: Error from Spotify's API
- `INTERNAL_ERROR`: Server-side error