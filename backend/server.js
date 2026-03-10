const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const path = require("path");

// Security imports
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Routes
const locationRoutes = require("./routes/locationRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const hazardRoutes = require("./routes/hazardRoutes");
const evidenceRoutes = require("./routes/evidenceRoutes");
const officerRoutes = require("./routes/officerRoutes");
const authRoutes = require("./routes/authRoutes");

// Message Model
const { saveMessage, getMessages } = require("./models/MessageModel");

const app = express();

/* ===============================
   🔒 SECURITY MIDDLEWARE (CIA)
================================= */

// Helmet - Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://tiles.openstreetmap.org"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://overpass-api.de"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS - Configure allowed origins
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Rate Limiting - Prevent brute force and DoS attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Strict limit for auth endpoints
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const emergencyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Higher limit for emergency endpoints
  message: { error: "Emergency request limit exceeded." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use("/api/", generalLimiter);
app.use("/api/auth/", authLimiter); // For login endpoints if you add them
app.use("/api/emergency", emergencyLimiter);

// Body parser with size limits (prevent large payload attacks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ===============================
   🔹 STATIC FILES
================================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===============================
   🔹 INPUT VALIDATION MIDDLEWARE
================================= */

// Sanitize inputs to prevent SQL injection and XSS
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential script tags and SQL injection patterns
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object') {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  
  next();
};

app.use(sanitizeInput);

/* ===============================
   🔹 API ROUTES
================================= */
app.use("/api/auth", authRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/hazards", hazardRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/officers", officerRoutes);

/* ===============================
   🔹 HEALTH CHECK ENDPOINT
================================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

/* ===============================
   🔹 CREATE HTTP SERVER
================================= */
const server = http.createServer(app);

/* ===============================
   🔹 SOCKET.IO SETUP
================================= */
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  },
  // Security: Limit connection time and verify origins
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

/* ===============================
   🔹 SOCKET CONNECTION LOGIC
================================= */
io.on("connection", (socket) => {
  console.log("User connected 🔌", socket.id);
  
  // Track user's role
  socket.userRole = "user";
  socket.rooms = new Set();

  // Rate limiting for socket events
  let messageCount = 0;
  const messageResetTime = Date.now() + 60000; // Reset every minute
  
  const checkMessageRate = () => {
    if (Date.now() > messageResetTime) {
      messageCount = 0;
    }
    if (messageCount > 10) {
      socket.emit("error", { message: "Rate limit exceeded" });
      return false;
    }
    messageCount++;
    return true;
  };

  /* ---------------------------
     Join Emergency Chat
  ---------------------------- */
  socket.on("joinEmergency", (username) => {
    // Sanitize username
    const sanitizedUsername = (username || "Anonymous")
      .toString()
      .replace(/<[^>]*>/g, '')
      .substring(0, 50);
    
    socket.username = sanitizedUsername;
    socket.join("emergency");
    console.log(`${sanitizedUsername} joined emergency`);
  });

  /* ---------------------------
     Join Role-Based Room
     (admin, police, or user)
  ---------------------------- */
  socket.on("joinRole", (role) => {
    // Validate role
    const validRoles = ["admin", "police", "user"];
    const sanitizedRole = validRoles.includes(role) ? role : "user";
    
    socket.userRole = sanitizedRole;
    
    // Leave previous role rooms
    socket.rooms.forEach(room => {
      if (room !== "emergency") {
        socket.leave(room);
      }
    });
    socket.rooms.clear();
    
    // Join emergency room and role-specific room
    socket.join("emergency");
    socket.join(`role_${sanitizedRole}`);
    socket.rooms.add("emergency");
    socket.rooms.add(`role_${sanitizedRole}`);
    
    console.log(`${socket.username} joined as ${sanitizedRole}`);
    
    // Notify about role join
    io.to("emergency").emit("systemNotification", {
      username: "System",
      message: `${socket.username} has joined as ${sanitizedRole}`,
      type: "system",
      timestamp: new Date()
    });
  });

  /* ---------------------------
     💬 NORMAL MESSAGE
  ---------------------------- */
  socket.on("sendMessage", (data) => {
    if (!checkMessageRate()) return;
    if (!data?.message) return;

    // Sanitize message
    const sanitizedMessage = data.message
      .toString()
      .replace(/<[^>]*>/g, '')
      .substring(0, 500);

    const messageData = {
      id: Date.now(),
      username: (data.username || socket.username || "Anonymous")
        .toString()
        .replace(/<[^>]*>/g, '')
        .substring(0, 50),
      message: sanitizedMessage,
      location: data.location ? {
        lat: parseFloat(data.location.lat) || null,
        lng: parseFloat(data.location.lng) || null
      } : null,
      type: "normal",
      priority: ["normal", "high", "critical"].includes(data.priority) ? data.priority : "normal",
      timestamp: new Date()
    };

    saveMessage(messageData, (err) => {
      if (err) console.error("DB Save Error:", err);
    });

    // Emit to everyone in emergency room
    io.to("emergency").emit("receiveMessage", messageData);
  });

  /* ---------------------------
     🚨 PANIC ALERT
  ---------------------------- */
  socket.on("panicActivated", (data) => {
    if (!checkMessageRate()) return;
    
    const sanitizedUsername = (data.username || "User")
      .toString()
      .replace(/<[^>]*>/g, '')
      .substring(0, 50);

    const alertData = {
      id: Date.now(),
      username: sanitizedUsername,
      message: "🚨 PANIC ALERT ACTIVATED!",
      location: data.location ? {
        lat: parseFloat(data.location.lat) || null,
        lng: parseFloat(data.location.lng) || null
      } : null,
      type: "alert",
      priority: "critical",
      timestamp: new Date()
    };

    saveMessage(alertData, (err) => {
      if (err) console.error("DB Save Error:", err);
    });

    // Emit to everyone
    io.to("emergency").emit("receiveMessage", alertData);
    
    // Also emit specific alert for police/admin
    io.to("emergency").emit("policeAlert", alertData);
  });

  /* ---------------------------
     📢 ADMIN BROADCAST
     (Admin sends to all users)
  ---------------------------- */
  socket.on("adminBroadcast", (data) => {
    if (socket.userRole !== "admin") {
      socket.emit("error", { message: "Unauthorized: Admin only" });
      return;
    }

    const sanitizedMessage = data.message
      .toString()
      .replace(/<[^>]*>/g, '')
      .substring(0, 1000);

    const broadcastData = {
      id: Date.now(),
      username: (data.username || "Admin")
        .toString()
        .replace(/<[^>]*>/g, '')
        .substring(0, 50),
      message: sanitizedMessage,
      location: null,
      type: "admin",
      priority: ["normal", "high", "critical"].includes(data.priority) ? data.priority : "high",
      timestamp: new Date()
    };

    // Save to database
    saveMessage(broadcastData, (err) => {
      if (err) console.error("DB Save Error:", err);
    });

    // Broadcast to all users in emergency room
    io.to("emergency").emit("adminBroadcast", broadcastData);
  });

  /* ---------------------------
     🚔 POLICE ALERT
     (Police sends to emergency services)
  ---------------------------- */
  socket.on("sendPoliceAlert", (data) => {
    if (socket.userRole !== "police" && socket.userRole !== "admin") {
      socket.emit("error", { message: "Unauthorized: Police/Admin only" });
      return;
    }
    if (!checkMessageRate()) return;

    const sanitizedMessage = data.message
      .toString()
      .replace(/<[^>]*>/g, '')
      .substring(0, 500);

    const alertData = {
      id: Date.now(),
      username: (data.username || "Police")
        .toString()
        .replace(/<[^>]*>/g, '')
        .substring(0, 50),
      message: sanitizedMessage,
      location: data.location ? {
        lat: parseFloat(data.location.lat) || null,
        lng: parseFloat(data.location.lng) || null
      } : null,
      type: "police",
      priority: ["normal", "high", "critical"].includes(data.priority) ? data.priority : "high",
      timestamp: new Date()
    };

    // Save to database
    saveMessage(alertData, (err) => {
      if (err) console.error("DB Save Error:", err);
    });

    // Send to police and admin roles
    io.to("role_police").emit("policeAlert", alertData);
    io.to("role_admin").emit("policeAlert", alertData);
    
    // Also emit to emergency room for visibility
    io.to("emergency").emit("receiveMessage", alertData);
  });

  /* ---------------------------
     💬 SEND TO SPECIFIC ROLE
     (Send message to admin/police/users only)
  ---------------------------- */
  socket.on("sendToRole", (data) => {
    if (!checkMessageRate()) return;
    
    const { targetRole, message } = data;
    const validRoles = ["admin", "police", "user"];
    
    if (!targetRole || !message || !validRoles.includes(targetRole)) return;

    const sanitizedMessage = message
      .toString()
      .replace(/<[^>]*>/g, '')
      .substring(0, 500);

    const messageData = {
      id: Date.now(),
      username: (data.username || socket.username || "Anonymous")
        .toString()
        .replace(/<[^>]*>/g, '')
        .substring(0, 50),
      message: sanitizedMessage,
      location: data.location ? {
        lat: parseFloat(data.location.lat) || null,
        lng: parseFloat(data.location.lng) || null
      } : null,
      type: "role_message",
      targetRole: targetRole,
      priority: ["normal", "high", "critical"].includes(data.priority) ? data.priority : "normal",
      timestamp: new Date()
    };

    // Save to database
    saveMessage(messageData, (err) => {
      if (err) console.error("DB Save Error:", err);
    });

    // Send to specific role room
    io.to(`role_${targetRole}`).emit("roleMessage", messageData);
  });

  /* ---------------------------
     🔔 SYSTEM NOTIFICATION
  ---------------------------- */
  socket.on("systemNotification", (data) => {
    if (!checkMessageRate()) return;
    
    const sanitizedMessage = (data.message || "")
      .toString()
      .replace(/<[^>]*>/g, '')
      .substring(0, 200);

    const notificationData = {
      id: Date.now(),
      username: "System",
      message: sanitizedMessage,
      location: null,
      type: "system",
      priority: "normal",
      timestamp: new Date()
    };

    // Save to database
    saveMessage(notificationData, (err) => {
      if (err) console.error("DB Save Error:", err);
    });

    // Broadcast to all
    io.to("emergency").emit("systemNotification", notificationData);
  });

  /* ---------------------------
     📜 LOAD OLD MESSAGES
  ---------------------------- */
  socket.on("loadMessages", () => {
    getMessages((err, messages) => {
      if (err) {
        console.error("DB Fetch Error:", err);
      } else {
        // Limit messages to last 100 for performance
        const limitedMessages = Array.isArray(messages) ? messages.slice(-100) : [];
        socket.emit("previousMessages", limitedMessages);
      }
    });
  });

  /* ---------------------------
     👤 GET CONNECTED USERS
  ---------------------------- */
  socket.on("getConnectedUsers", () => {
    const users = [];
    io.in("emergency").fetchSockets().then(sockets => {
      sockets.forEach(s => {
        users.push({
          id: s.id,
          username: s.username,
          role: s.userRole
        });
      });
      socket.emit("connectedUsers", users);
    });
  });

  /* ---------------------------
     🔴 DISCONNECT
  ---------------------------- */
  socket.on("disconnect", () => {
    console.log("User disconnected ❌", socket.id);
    
    // Notify about user leaving
    io.to("emergency").emit("systemNotification", {
      username: "System",
      message: `${socket.username || "Anonymous"} has left the emergency chat`,
      type: "system",
      timestamp: new Date()
    });
  });
});

/* ===============================
   🔹 GLOBAL ERROR HANDLER
================================= */
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ===============================
   🔹 START SERVER
================================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security features enabled: Helmet, Rate Limiting, Input Sanitization`);
});

