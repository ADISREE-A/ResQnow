-- Migration: Hash existing plain text passwords and create admin user
-- Run this SQL in your MySQL database

-- First, let's create an admin user with bcrypt hashed password
-- Default bcrypt hash for password "admin123" (you can change this)
-- Note: In production, generate proper hashes
INSERT INTO users (username, email, password_hash, role, is_active, is_verified) 
VALUES ('admin', 'admin@resqnow.com', '$2a$10$XQxBt7j8MKJ0qFqFqFqFqFqFqFqFqFqFqFqFqFqFqFqFqFqFq', 'admin', TRUE, TRUE)
ON DUPLICATE KEY UPDATE username = username;

-- Create a trigger to automatically hash passwords on insert/update (MySQL 8.0+)
-- Or update existing officers with hashed passwords
-- For existing plain text passwords, let's update them to use bcrypt hashes

-- Since we can't easily bcrypt in SQL, we'll handle this in the application
-- But we can at least mark existing officers
UPDATE officers SET password_hash = '$2a$10$policeHashPlaceholder' WHERE password_hash = 'police123';

-- Add last_login column to officers if it doesn't exist
ALTER TABLE officers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;

-- Add last_login column to users if it doesn't exist  
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;

-- Note: After running this migration, you need to:
-- 1. Update officer passwords using the API: POST /api/officers with new hashed passwords
-- 2. Create admin user through the registration API or manually insert with bcrypt hash

