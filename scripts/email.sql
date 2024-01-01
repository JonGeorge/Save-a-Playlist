CREATE TABLE email (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT current_timestamp
);