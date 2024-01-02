# Save a playlist

[Saveaplaylist.com](https://saveaplaylist.com) allows you to take a snapshot of 
Spotify playlists.

## Background

Many Spotify users have expressed interest in the ability 
to opt-out of playlist updates, however, [this is not a feature Spotify 
offers.](https://support.spotify.com/us/article/save-recover-playlists/) 
What does this mean? A playlist you've had on repeat for the last 
two weeks can be changed or removed at any time at the discretion of the playlist owner. 

Sometimes having songs removed from or added to a playlist is refreshing; a change in the order of your playlists' songs is welcomed.

For the times when playlist changes are not welcomed, you can use saveaplaylist.com to capture the current state of a playlist for future enjoyment.

Some playlists are perfect the way they are!

## How it works

It's simple. We use the Spotify API to:

1. Search for existing playlists.
2. Create a new playlist in your account, owned by you.
3. Add each song from the playlist you want to save to your new playlist.

These steps are [Spotify's recommended method](https://support.spotify.com/us/article/save-recover-playlists/) to save a playlist, we've just 
automated it. 🤓

## Run Save-a-playlist locally
First run `git clone https://github.com/JonGeorge/Save-a-Playlist.git`. Then, there are 3 things you must do to get the application running locally:

1. Create a `.env` file containing application environment variables.
2. Create a `.env.db` file containing database environment variables.
3. Comment out the certbot and nginx services in docker-compose.yml.

### 1. Create a `.env` file
In the project root directory, create a file named `.env` and set the following values:
```bash
# Set to true for verbose application logging
DEBUG=true

# Set the port on which the application should listen
PORT=

# Set the protocol used by the application (use "http://" for local dev)
PROTOCOL=http://

# Spotify credentials
CLIENT_ID=
CLIENT_SECRET=

# Random string for session cookie encryption
COOKIE_SECRET=

# Database details allowing the application to connect to the database
PGHOST=
PGUSER=
PGDATABASE=
PGPASSWORD=
PGPORT=
```

### 2. Create a `.env.db` file
In the project root directory, create a file named `.env.db` and set the following values:
```bash
# Set the database password
POSTGRES_PASSWORD=

# Set the database to create
POSTGRES_DB=

# Set the database user
POSTGRES_USER=
```
