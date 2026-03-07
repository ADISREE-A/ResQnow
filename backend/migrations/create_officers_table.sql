-- Migration: Create officers table
-- Run this SQL in your MySQL database

-- Create officers table
CREATE TABLE IF NOT EXISTS officers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  badge_number VARCHAR(50) UNIQUE NOT NULL,
  officer_name VARCHAR(255) NOT NULL,
  `rank` VARCHAR(100),
  station VARCHAR(255),
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add assigned_by column to hazards table if it doesn't exist
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255) NULL;

-- Insert sample officers for testing
INSERT INTO officers (badge_number, officer_name, `rank`, station, email, password_hash, is_active) VALUES
('OFF001', 'Officer John Smith', 'Sergeant', 'Central Police Station', 'john.smith@police.gov', 'police123', TRUE),
('OFF002', 'Officer Jane Doe', 'Detective', 'Central Police Station', 'jane.doe@police.gov', 'police123', TRUE),
('OFF003', 'Officer Mike Johnson', 'Patrol', 'North Station', 'mike.johnson@police.gov', 'police123', TRUE),
('OFF004', 'Officer Sarah Williams', 'Lieutenant', 'Central Police Station', 'sarah.williams@police.gov', 'police123', TRUE),
('OFF005', 'Officer David Brown', 'Constable', 'South Station', 'david.brown@police.gov', 'police123', TRUE);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_officer_badge ON officers(badge_number);
CREATE INDEX IF NOT EXISTS idx_officer_name ON officers(officer_name);
CREATE INDEX IF NOT EXISTS idx_hazards_assigned_by ON hazards(assigned_by);

