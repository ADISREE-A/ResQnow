-- Migration: Add police-related columns to hazards table
-- Run this SQL in your MySQL database

ALTER TABLE hazards 
ADD COLUMN assigned_officer VARCHAR(255) NULL,
ADD COLUMN officer_id VARCHAR(100) NULL,
ADD COLUMN report JSON NULL,
ADD COLUMN resolution_notes TEXT NULL;

-- Optional: Add index for faster queries
CREATE INDEX idx_assigned_officer ON hazards(assigned_officer);
CREATE INDEX idx_status ON hazards(status);

