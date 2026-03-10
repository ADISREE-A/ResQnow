const jwt = require("jsonwebtoken");
const db = require("../config/db");

// JWT Secret from environment or use default (in production, use strong secret)
const JWT_SECRET = process.env.JWT_SECRET || "resqnow_secret_key_2024";

/* ========================================
   🔹 Verify Token Middleware
   ======================================== */
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please login again." });
    }
    return res.status(403).json({ error: "Invalid token." });
  }
};

/* ========================================
   🔹 Verify Admin Role Middleware
   ======================================== */
const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }
  next();
};

/* ========================================
   🔹 Verify Police/Admin Role Middleware
   ======================================== */
const verifyPoliceOrAdmin = (req, res, next) => {
  if (req.user?.role !== "admin" && req.user?.role !== "police") {
    return res.status(403).json({ error: "Access denied. Police/Admin only." });
  }
  next();
};

/* ========================================
   🔹 Optional Auth Middleware
   (Doesn't fail if no token, just adds user if token exists)
   ======================================== */
const optionalAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

/* ========================================
   🔹 Generate Token Helper
   ======================================== */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

/* ========================================
   🔹 Generate Refresh Token Helper
   ======================================== */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || "resqnow_refresh_secret_2024",
    { expiresIn: "7d" }
  );
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyPoliceOrAdmin,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  JWT_SECRET
};

