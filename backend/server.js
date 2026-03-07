const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const path = require("path");

// Routes
const locationRoutes = require("./routes/locationRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const hazardRoutes = require("./routes/hazardRoutes");
const evidenceRoutes = require("./routes/evidenceRoutes");
const officerRoutes = require("./routes/officerRoutes");

// Message Model
const { saveMessage, getMessages } = require("./models/MessageModel");

const app = express();

/* ===============================
   🔹 MIDDLEWARE
================================= */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   🔹 STATIC FILES
================================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===============================
   🔹 API ROUTES
================================= */
app.use("/api/emergency", emergencyRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/hazards", hazardRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/officers", officerRoutes);

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
  }
});

/* ===============================
   🔹 SOCKET CONNECTION LOGIC
================================= */
io.on("connection", (socket) => {
  console.log("User connected 🔌", socket.id);
  
  // Track user's role
  socket.userRole = "user";
  socket.rooms = new Set();

  /* ---------------------------
     Join Emergency Chat
  ---------------------------- */
  socket.on("joinEmergency", (username) => {
    socket.username = username || "Anonymous";
    socket.join("emergency");
    console.log(`${socket.username} joined emergency`);
  });

  /* ---------------------------
     Join Role-Based Room
     (admin, police, or user)
  ---------------------------- */
  socket.on("joinRole", (role) => {
    socket.userRole = role || "user";
    
    // Leave previous role rooms
    socket.rooms.forEach(room => {
      if (room !== "emergency") {
        socket.leave(room);
      }
    });
    socket.rooms.clear();
    
    // Join emergency room and role-specific room
    socket.join("emergency");
    socket.join(`role_${role}`);
    socket.rooms.add("emergency");
    socket.rooms.add(`role_${role}`);
    
    console.log(`${socket.username} joined as ${role}`);
    
    // Notify about role join
    io.to("emergency").emit("systemNotification", {
      username: "System",
      message: `${socket.username} has joined as ${role}`,
      type: "system",
      timestamp: new Date()
    });
  });

  /* ---------------------------
     💬 NORMAL MESSAGE
  ---------------------------- */
  socket.on("sendMessage", (data) => {
    if (!data?.message) return;

    const messageData = {
      id: Date.now(),
      username: data.username || "Anonymous",
      message: data.message,
      location: data.location || null,
      type: "normal",
      priority: data.priority || "normal",
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
    const alertData = {
      id: Date.now(),
      username: data.username || "User",
      message: "🚨 PANIC ALERT ACTIVATED!",
      location: data.location || null,
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

    const broadcastData = {
      id: Date.now(),
      username: data.username || "Admin",
      message: data.message,
      location: null,
      type: "admin",
      priority: data.priority || "high",
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

    const alertData = {
      id: Date.now(),
      username: data.username || "Police",
      message: data.message,
      location: data.location || null,
      type: "police",
      priority: data.priority || "high",
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
    const { targetRole, message } = data;
    
    if (!targetRole || !message) return;

    const messageData = {
      id: Date.now(),
      username: data.username || socket.username || "Anonymous",
      message: message,
      location: data.location || null,
      type: "role_message",
      targetRole: targetRole,
      priority: data.priority || "normal",
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
    const notificationData = {
      id: Date.now(),
      username: "System",
      message: data.message,
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
        socket.emit("previousMessages", messages);
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
});

