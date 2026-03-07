-- Migration: Add AI Analysis columns to evidence table
-- Run this SQL to enable AI video analysis features

-- Check if ai_analysis column exists, if not add it
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS ai_analysis JSON;

-- Add case_id column to link evidence to hazard cases
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS case_id VARCHAR(255);

-- Add analyzed_at timestamp
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS analyzed_at DATETIME;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);

-- Create index for analyzed evidence
CREATE INDEX IF NOT EXISTS idx_evidence_analyzed ON evidence(analyzed_at);

-- Note: If you're using MySQL, use these commands instead:
-- ALTER TABLE evidence ADD COLUMN ai_analysis JSON;
-- ALTER TABLE evidence ADD COLUMN case_id VARCHAR(255);
-- ALTER TABLE evidence ADD COLUMN analyzed_at DATETIME;
-- CREATE INDEX idx_evidence_case_id ON evidence(case_id);
-- CREATE INDEX idx_evidence_analyzed ON evidence(analyzed_at);

