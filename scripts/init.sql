CREATE TABLE IF NOT EXISTS client (
    id SERIAL PRIMARY KEY,
    client_id uuid NOT NULL,
    spotify_token VARCHAR NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT current_timestamp
);