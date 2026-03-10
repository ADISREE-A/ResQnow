const mysql = require("mysql2");
require("dotenv").config();

const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "resqnow",
  multipleStatements: true
};

const connection = mysql.createConnection(config);

console.log("Connecting to MySQL...");

connection.connect(async (err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.message);
    process.exit(1);
  }

  console.log("Connected to MySQL successfully!");

  try {
    await queryAsync(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
    await queryAsync(`USE ${config.database}`);
    console.log("Database ready!");

    // Create users table
    await queryAsync(`
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
      )
    `);
    console.log("Users table ready!");

    // Create officers table
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS officers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        badge_number VARCHAR(50) UNIQUE NOT NULL,
        officer_name VARCHAR(255) NOT NULL,
        officer_rank VARCHAR(100),
        station VARCHAR(255),
        email VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Officers table ready!");

    // Create hazards table
    await queryAsync(`
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
      )
    `);
    console.log("Hazards table ready!");

    // Create evidence table
    await queryAsync(`
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
      )
    `);
    console.log("Evidence table ready!");

    // Create messages table
    await queryAsync(`
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
      )
    `);
    console.log("Messages table ready!");

    // Create fake_emergency_flags table
    await queryAsync(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Fake Emergency Flags table ready!");

    // Insert sample data
    const bcrypt = require("bcryptjs");
    const SALT_ROUNDS = 10;
    const hashedPassword = bcrypt.hashSync("police123", SALT_ROUNDS);

    await queryAsync(`
      INSERT IGNORE INTO officers (badge_number, officer_name, officer_rank, station, email, password_hash, is_active) VALUES
      ('OFF001', 'Officer John Smith', 'Sergeant', 'Central Police Station', 'john.smith@police.gov', '${hashedPassword}', TRUE),
      ('OFF002', 'Officer Jane Doe', 'Detective', 'Central Police Station', 'jane.doe@police.gov', '${hashedPassword}', TRUE),
      ('OFF003', 'Officer Mike Johnson', 'Patrol', 'North Station', 'mike.johnson@police.gov', '${hashedPassword}', TRUE),
      ('OFF004', 'Officer Sarah Williams', 'Lieutenant', 'Central Police Station', 'sarah.williams@police.gov', '${hashedPassword}', TRUE),
      ('OFF005', 'Officer David Brown', 'Constable', 'South Station', 'david.brown@police.gov', '${hashedPassword}', TRUE)
    `);
    console.log("Sample officers inserted!");

    const adminPassword = bcrypt.hashSync("admin123", SALT_ROUNDS);
    await queryAsync(`
      INSERT IGNORE INTO users (username, email, password_hash, role, is_active, is_verified) VALUES
      ('admin', 'admin@resqnow.com', '${adminPassword}', 'admin', TRUE, TRUE)
    `);
    console.log("Admin user inserted!");

    console.log("\n========================================");
    console.log("DATABASE SETUP COMPLETE!");
    console.log("========================================");
    console.log("\nDefault Login Credentials:");
    console.log("  Admin:  username: admin,  password: admin123");
    console.log("  Police: badge: OFF001, password: police123");
    console.log("\n========================================");

    connection.end();
    process.exit(0);

  } catch (error) {
    console.error("Error:", error.message);
    connection.end();
    process.exit(1);
  }
});

function queryAsync(sql) {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

