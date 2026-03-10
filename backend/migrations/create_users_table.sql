-- Migration: Create users table for authentication
-- Run this SQL in your MySQL database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('user', 'admin', 'police') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create fake_emergency_flags table for tracking suspicious reports
CREATE TABLE IF NOT EXISTS fake_emergency_flags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id VARCHAR(100) NOT NULL,
  user_id INT,
  username VARCHAR(255),
  reason VARCHAR(500),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  is_confirmed BOOLEAN DEFAULT FALSE,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fake_flags_case_id ON fake_emergency_flags(case_id);
CREATE INDEX IF NOT EXISTS idx_fake_flags_user_id ON fake_emergency_flags(user_id);

-- Add user_tracking columns to hazards table for anomaly detection
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS user_id INT NULL;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS device_id VARCHAR(255) NULL;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS is_verified_user BOOLEAN DEFAULT FALSE;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS fake_emergency_risk_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE hazards ADD COLUMN IF NOT EXISTS fake_emergency_flags JSON;

-- Add admin credentials to users table (run separately if needed)
-- INSERT INTO users (username, email, password_hash, role, is_active, is_verified) 
-- VALUES ('admin', 'admin@resqnow.com', '$2a$10$YOUR_HASHED_PASSWORD', 'admin', TRUE, TRUE);

