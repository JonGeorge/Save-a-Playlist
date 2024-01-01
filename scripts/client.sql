CREATE TABLE client(
    id SERIAL PRIMARY KEY NOT NULL,
    token TEXT NOT NULL,
    last_modified TIMESTAMP NOT NULL
);

CREATE OR REPLACE FUNCTION update_last_modified_column()
RETURNS TRIGGER AS
$$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_client_last_modified ON client;

CREATE TRIGGER update_client_last_modified 
BEFORE INSERT OR UPDATE ON client 
FOR EACH ROW EXECUTE PROCEDURE
update_last_modified_column();