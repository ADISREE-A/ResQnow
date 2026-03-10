const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Salt rounds for bcrypt
const SALT_ROUNDS = 10;

/* ========================================
   🔹 Create New User
   ======================================== */
const createUser = (user, callback) => {
  const sql = `
    INSERT INTO users 
    (username, email, password_hash, phone, role, is_active, is_verified) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  // Hash password before storing
  bcrypt.hash(user.password, SALT_ROUNDS, (err, hash) => {
    if (err) {
      return callback(err);
    }
    
    db.query(
      sql,
      [
        user.username,
        user.email,
        hash,
        user.phone || null,
        user.role || "user",
        true,
        false
      ],
      callback
    );
  });
};

/* ========================================
   🔹 Get User by Username
   ======================================== */
const getUserByUsername = (username, callback) => {
  const sql = "SELECT * FROM users WHERE username = ? AND is_active = TRUE";
  db.query(sql, [username], callback);
};

/* ========================================
   🔹 Get User by Email
   ======================================== */
const getUserByEmail = (email, callback) => {
  const sql = "SELECT * FROM users WHERE email = ? AND is_active = TRUE";
  db.query(sql, [email], callback);
};

/* ========================================
   🔹 Get User by ID
   ======================================== */
const getUserById = (id, callback) => {
  const sql = "SELECT id, username, email, phone, role, is_active, is_verified, last_login, created_at FROM users WHERE id = ? AND is_active = TRUE";
  db.query(sql, [id], callback);
};

/* ========================================
   🔹 Verify User Credentials
   ======================================== */
const verifyUser = (usernameOrEmail, password, callback) => {
  const sql = "SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE";
  
  db.query(sql, [usernameOrEmail, usernameOrEmail], (err, results) => {
    if (err) {
      return callback(err);
    }
    
    if (results.length === 0) {
      return callback(null, []);
    }
    
    const user = results[0];
    
    // Compare password with hash
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        return callback(err);
      }
      
      if (isMatch) {
        // Update last login
        db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);
        return callback(null, [user]);
      } else {
        return callback(null, []);
      }
    });
  });
};

/* ========================================
   🔹 Update User Password
   ======================================== */
const updatePassword = (userId, newPassword, callback) => {
  bcrypt.hash(newPassword, SALT_ROUNDS, (err, hash) => {
    if (err) {
      return callback(err);
    }
    
    const sql = "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?";
    db.query(sql, [hash, userId], callback);
  });
};

/* ========================================
   🔹 Get All Users (Admin only)
   ======================================== */
const getAllUsers = (callback) => {
  const sql = `
    SELECT id, username, email, phone, role, is_active, is_verified, last_login, created_at 
    FROM users 
    ORDER BY created_at DESC
  `;
  db.query(sql, callback);
};

/* ========================================
   🔹 Get Users by Role
   ======================================== */
const getUsersByRole = (role, callback) => {
  const sql = "SELECT id, username, email, role, is_active, is_verified, created_at FROM users WHERE role = ? AND is_active = TRUE ORDER BY username";
  db.query(sql, [role], callback);
};

/* ========================================
   🔹 Deactivate User
   ======================================== */
const deactivateUser = (userId, callback) => {
  const sql = "UPDATE users SET is_active = FALSE WHERE id = ?";
  db.query(sql, [userId], callback);
};

/* ========================================
   🔹 Activate User
   ======================================== */
const activateUser = (userId, callback) => {
  const sql = "UPDATE users SET is_active = TRUE WHERE id = ?";
  db.query(sql, [userId], callback);
};

/* ========================================
   🔹 Update User Role
   ======================================== */
const updateUserRole = (userId, role, callback) => {
  const sql = "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?";
  db.query(sql, [role, userId], callback);
};

/* ========================================
   🔹 Verify User Email
   ======================================== */
const verifyUserEmail = (userId, callback) => {
  const sql = "UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = ?";
  db.query(sql, [userId], callback);
};

module.exports = {
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  verifyUser,
  updatePassword,
  getAllUsers,
  getUsersByRole,
  deactivateUser,
  activateUser,
  updateUserRole,
  verifyUserEmail
};

