
-- Add provider column to users table
ALTER TABLE users ADD COLUMN provider VARCHAR(20) DEFAULT 'local';

-- Make password nullable for OAuth2 users
ALTER TABLE users MODIFY COLUMN password VARCHAR(100) NULL;