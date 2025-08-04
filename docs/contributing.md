
## Run Save-a-playlist locally

### Prerequisites
- Node.js (version 14 or higher)
- Vercel CLI: `npm install -g vercel`

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/JonGeorge/Save-a-Playlist.git
   cd Save-a-Playlist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the project root with the following variables:
   ```bash
   # Set to true for verbose application logging
   DEBUG=true

   # Development port (default: 3001)
   PORT=3001

   # Protocol for OAuth redirects (use "http://" for local dev)
   PROTOCOL=http://

   # Spotify API credentials (get from https://developer.spotify.com/)
   CLIENT_ID=your_spotify_client_id
   CLIENT_SECRET=your_spotify_client_secret

   # JWT signing secret (generate a random secure string)
   JWT_SECRET=your_random_jwt_secret
   ```

4. **Configure Spotify App**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app or use an existing one
   - Add `http://localhost:3001/login/callback` to your app's redirect URIs

5. **Start the development server**
   ```bash
   vercel dev --listen 3001
   ```

The application will be available at `http://localhost:3001`

### Development Commands
```bash
# Start development server
vercel dev --listen 3001

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Build for production
npm run build
```
