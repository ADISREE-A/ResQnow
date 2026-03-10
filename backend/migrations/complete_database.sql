-- ================================================
-- RESQNOW DATABASE - COMPLETE SQL TABLES
-- Run this in your MySQL database
-- ================================================

-- 1. USERS TABLE (Authentication)
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

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. OFFICERS TABLE (Police)
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

CREATE INDEX idx_officer_badge ON officers(badge_number);
CREATE INDEX idx_officer_name ON officers(officer_name);

-- 3. HAZARDS TABLE (Emergency Cases)
CREATE TABLE IF NOT EXISTS hazards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(255),
  type VARCHAR(100),
  severity VARCHAR(50),
  auto_severity VARCHAR(50),
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  risk_score DECIMAL(5,2),
  risk_level VARCHAR(50),
  confidence INT,
  status VARCHAR(20) DEFAULT 'Open',
  assigned_officer VARCHAR(255),
  officer_id VARCHAR(100),
  assigned_by VARCHAR(255),
  report JSON,
  resolution_notes TEXT,
  user_id INT,
  device_id VARCHAR(255),
  is_verified_user BOOLEAN DEFAULT FALSE,
  fake_emergency_risk_score DECIMAL(5,2) DEFAULT 0,
  fake_emergency_flags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_hazards_case_id ON hazards(case_id);
CREATE INDEX idx_hazards_status ON hazards(status);
CREATE INDEX idx_assigned_officer ON hazards(assigned_officer);
CREATE INDEX idx_hazards_assigned_by ON hazards(assigned_by);

-- 4. EVIDENCE TABLE (Video/Audio Recordings)
CREATE TABLE IF NOT EXISTS evidence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_path VARCHAR(500),
  file_type VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  user_id INT,
  username VARCHAR(255),
  ai_analysis JSON,
  case_id VARCHAR(255),
  analyzed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evidence_case_id ON evidence(case_id);
CREATE INDEX idx_evidence_analyzed ON evidence(analyzed_at);

-- 5. MESSAGES TABLE (Chat/Emergency Communications)
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender VARCHAR(255) NOT NULL,
  recipient VARCHAR(255),
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'text',
  priority VARCHAR(20) DEFAULT 'normal',
  target_role VARCHAR(20) DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_sender ON messages(sender);
CREATE INDEX idx_messages_recipient ON messages(recipient);
CREATE INDEX idx_messages_created ON messages(created_at);

-- 6. FAKE_EMERGENCY_FLAGS TABLE (Anomaly Detection)
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

CREATE INDEX idx_fake_flags_case_id ON fake_emergency_flags(case_id);
CREATE INDEX idx_fake_flags_user_id ON fake_emergency_flags(user_id);

-- ================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================

-- Insert default admin (password: admin123 - CHANGE IN PRODUCTION)
-- Use bcrypt to hash password before inserting
INSERT INTO users (username, email, password_hash, role, is_active, is_verified) 
VALUES ('admin', 'admin@resqnow.com', '$2a$10$ExampleHashHere', 'admin', TRUE, TRUE);

-- Insert sample officers (password: police123 for all)
INSERT INTO officers (badge_number, officer_name, `rank`, station, email, password_hash, is_active) VALUES
('OFF001', 'Officer John Smith', 'Sergeant', 'Central Police Station', 'john.smith@police.gov', '$2a$10$ExampleHashHere', TRUE),
('OFF002', 'Officer Jane Doe', 'Detective', 'Central Police Station', 'jane.doe@police.gov', '$2a$10$ExampleHashHere', TRUE),
('OFF003', 'Officer Mike Johnson', 'Patrol', 'North Station', 'mike.johnson@police.gov', '$2a$10$ExampleHashHere', TRUE),
('OFF004', 'Officer Sarah Williams', 'Lieutenant', 'Central Police Station', 'sarah.williams@police.gov', '$2a$10$ExampleHashHere', TRUE),
('OFF005', 'Officer David Brown', 'Constable', 'South Station', 'david.brown@police.gov', '$2a$10$ExampleHashHere', TRUE);

