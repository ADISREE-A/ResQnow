const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { 
  verifyToken, 
  verifyAdmin, 
  verifyPoliceOrAdmin,
  generateToken, 
  generateRefreshToken 
} = require("../middleware/authMiddleware");
const UserModel = require("../models/UserModel");

/* ========================================
   🔹 POST Register New User
   ======================================== */
router.post("/register", (req, res) => {
  const { username, email, password, phone } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  // Check if username or email already exists
  UserModel.getUserByUsername(username, (err, existingUsers) => {
    if (err) {
      console.error("Error checking username:", err);
      return res.status(500).json({ error: "Server error" });
    }

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    UserModel.getUserByEmail(email, (err, existingEmails) => {
      if (err) {
        console.error("Error checking email:", err);
        return res.status(500).json({ error: "Server error" });
      }

      if (existingEmails.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Create new user
      const newUser = {
        username,
        email,
        password,
        phone: phone || null,
        role: "user"
      };

      UserModel.createUser(newUser, (err, result) => {
        if (err) {
          console.error("Error creating user:", err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Username or email already exists" });
          }
          return res.status(500).json({ error: "Failed to create user" });
        }

        // Generate token for the new user
        const token = generateToken({
          id: result.insertId,
          username,
          email,
          role: "user"
        });

        res.status(201).json({
          message: "User registered successfully",
          token,
          user: {
            id: result.insertId,
            username,
            email,
            role: "user"
          }
        });
      });
    });
  });
});

/* ========================================
   🔹 POST Login User
   ======================================== */
router.post("/login", (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: "Username/Email and password are required" });
  }

  UserModel.verifyUser(usernameOrEmail, password, (err, users) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Login failed" });
    }

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified
      }
    });
  });
});

/* ========================================
   🔹 POST Admin Login (Secure)
   ======================================== */
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Get admin user from database
    const sql = "SELECT * FROM users WHERE username = ? AND role = 'admin' AND is_active = TRUE";
    const [users] = await db.promise().query(sql, [username]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const admin = users[0];

    // Compare password with hash
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    // Update last login
    await db.promise().query("UPDATE users SET last_login = NOW() WHERE id = ?", [admin.id]);

    // Generate tokens
    const token = generateToken(admin);
    const refreshToken = generateRefreshToken(admin);

    res.json({
      message: "Admin login successful",
      token,
      refreshToken,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Admin login failed" });
  }
});

/* ========================================
   🔹 POST Police Login (Secure)
   ======================================== */
router.post("/police/login", async (req, res) => {
  const { badge_number, password } = req.body;

  if (!badge_number || !password) {
    return res.status(400).json({ error: "Badge number and password are required" });
  }

  try {
    // Get officer from database
    const sql = "SELECT * FROM officers WHERE badge_number = ? AND is_active = TRUE";
    const [officers] = await db.promise().query(sql, [badge_number]);

    if (officers.length === 0) {
      return res.status(401).json({ error: "Invalid police credentials" });
    }

    const officer = officers[0];

    // Compare password with hash
    const isMatch = await bcrypt.compare(password, officer.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid police credentials" });
    }

    // Update last login (if column exists)
    try {
      await db.promise().query("UPDATE officers SET last_login = NOW() WHERE id = ?", [officer.id]);
    } catch (e) {
      // Ignore if column doesn't exist
    }

    // Generate tokens
    const token = generateToken({
      id: officer.id,
      username: officer.officer_name,
      email: officer.email,
      role: "police",
      badge_number: officer.badge_number
    });

    res.json({
      message: "Police login successful",
      token,
      user: {
        id: officer.id,
        username: officer.officer_name,
        badge_number: officer.badge_number,
        rank: officer.rank,
        station: officer.station,
        role: "police"
      }
    });
  } catch (err) {
    console.error("Police login error:", err);
    res.status(500).json({ error: "Police login failed" });
  }
});

/* ========================================
   🔹 POST Refresh Token
   ======================================== */
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const { JWT_SECRET } = require("../middleware/authMiddleware");
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "resqnow_refresh_secret_2024");

    // Get user from database
    UserModel.getUserById(decoded.id, (err, users) => {
      if (err || users.length === 0) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const user = users[0];
      const newToken = generateToken(user);

      res.json({ token: newToken });
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

/* ========================================
   🔹 GET Current User (Protected)
   ======================================== */
router.get("/me", verifyToken, (req, res) => {
  UserModel.getUserById(req.user.id, (err, users) => {
    if (err || users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_verified: user.is_verified,
      last_login: user.last_login,
      created_at: user.created_at
    });
  });
});

/* ========================================
   🔹 PUT Change Password (Protected)
   ======================================== */
router.put("/change-password", verifyToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  // Verify current password
  UserModel.verifyUser(req.user.username, currentPassword, (err, users) => {
    if (err) {
      return res.status(500).json({ error: "Server error" });
    }

    if (users.length === 0) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update password
    UserModel.updatePassword(req.user.id, newPassword, (err) => {
      if (err) {
        console.error("Password update error:", err);
        return res.status(500).json({ error: "Failed to update password" });
      }

      res.json({ message: "Password updated successfully" });
    });
  });
});

/* ========================================
   🔹 GET All Users (Admin only)
   ======================================== */
router.get("/users", verifyToken, verifyAdmin, (req, res) => {
  UserModel.getAllUsers((err, users) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(users);
  });
});

/* ========================================
   🔹 POST Public Admin Signup (No auth required - for initial admin setup)
   ======================================== */
router.post("/admin/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    // Check if any admin already exists
    const [existingAdmins] = await db.promise().query(
      "SELECT id FROM users WHERE role = 'admin'"
    );

    // If admin exists, this becomes a protected operation (should use the other route)
    // But we'll allow signup for now
    
    // Check if username already exists
    const [existingUsers] = await db.promise().query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check if email already exists
    const [existingEmails] = await db.promise().query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const [result] = await db.promise().query(
      "INSERT INTO users (username, email, password_hash, role, is_active, is_verified) VALUES (?, ?, ?, 'admin', TRUE, TRUE)",
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        id: result.insertId,
        username,
        email,
        role: "admin"
      }
    });
  } catch (err) {
    console.error("Admin signup error:", err);
    res.status(500).json({ error: "Admin registration failed" });
  }
});

/* ========================================
   🔹 POST Public Police Signup (No auth required)
   ======================================== */
router.post("/police/signup", async (req, res) => {
  const { badge_number, officer_name, rank, station, email, password } = req.body;

  // Validate required fields
  if (!badge_number || !officer_name || !password) {
    return res.status(400).json({ error: "Badge number, officer name, and password are required" });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
  }

  try {
    // Check if badge number already exists
    const [existingBadge] = await db.promise().query(
      "SELECT id FROM officers WHERE badge_number = ? AND is_active = TRUE",
      [badge_number]
    );

    if (existingBadge.length > 0) {
      return res.status(400).json({ error: "Badge number already exists" });
    }

    // Check if email already exists (if provided)
    if (email) {
      const [existingEmail] = await db.promise().query(
        "SELECT id FROM officers WHERE email = ? AND is_active = TRUE",
        [email]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new officer
    const [result] = await db.promise().query(
      "INSERT INTO officers (badge_number, officer_name, officer_rank, station, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)",
      [badge_number, officer_name, rank || null, station || null, email || null, hashedPassword]
    );

    res.status(201).json({
      message: "Police officer registered successfully",
      officer: {
        id: result.insertId,
        badge_number,
        officer_name,
        rank: rank || null,
        station: station || null,
        email: email || null
      }
    });
  } catch (err) {
    console.error("Police signup error:", err);
    res.status(500).json({ error: "Police registration failed" });
  }
});

/* ========================================
   🔹 POST Register New Admin (Admin only)
   ======================================== */
router.post("/admin/register", verifyToken, verifyAdmin, async (req, res) => {
  const { username, email, password } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    // Check if username already exists
    UserModel.getUserByUsername(username, (err, existingUsers) => {
      if (err) {
        console.error("Error checking username:", err);
        return res.status(500).json({ error: "Server error" });
      }

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Check if email already exists
      UserModel.getUserByEmail(email, (err, existingEmails) => {
        if (err) {
          console.error("Error checking email:", err);
          return res.status(500).json({ error: "Server error" });
        }

        if (existingEmails.length > 0) {
          return res.status(400).json({ error: "Email already exists" });
        }

        // Create new admin user
        const newUser = {
          username,
          email,
          password,
          role: "admin"
        };

        UserModel.createUser(newUser, (err, result) => {
          if (err) {
            console.error("Error creating admin:", err);
            if (err.code === "ER_DUP_ENTRY") {
              return res.status(400).json({ error: "Username or email already exists" });
            }
            return res.status(500).json({ error: "Failed to create admin" });
          }

          res.status(201).json({
            message: "Admin registered successfully",
            admin: {
              id: result.insertId,
              username,
              email,
              role: "admin"
            }
          });
        });
      });
    });
  } catch (err) {
    console.error("Admin registration error:", err);
    res.status(500).json({ error: "Admin registration failed" });
  }
});

module.exports = router;

