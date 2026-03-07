-- Add priority and target_role columns to messages table
ALTER TABLE messages ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE messages ADD COLUMN target_role VARCHAR(20) DEFAULT NULL;

