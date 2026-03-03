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

  /* ---------------------------
     Join Emergency Chat
  ---------------------------- */
  socket.on("joinEmergency", (username) => {
    socket.username = username || "Anonymous";
    console.log(`${socket.username} joined emergency`);
  });

  /* ---------------------------
     💬 NORMAL MESSAGE
  ---------------------------- */
  socket.on("sendMessage", (data) => {
    if (!data?.message) return;

    const messageData = {
      username: data.username || "Anonymous",
      message: data.message,
      location: data.location || null,
      type: "normal",
      timestamp: new Date()
    };

    saveMessage(messageData, (err) => {
      if (err) console.error("DB Save Error:", err);
    });

    io.emit("receiveMessage", messageData);
  });

  /* ---------------------------
     🚨 PANIC ALERT
  ---------------------------- */
  socket.on("panicActivated", (data) => {
    const alertData = {
      username: data.username || "User",
      message: "🚨 PANIC ALERT ACTIVATED!",
      location: data.location || null,
      type: "alert",
      timestamp: new Date()
    };

    saveMessage(alertData, (err) => {
      if (err) console.error("DB Save Error:", err);
    });

    io.emit("receiveMessage", alertData);
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
     🔴 DISCONNECT
  ---------------------------- */
  socket.on("disconnect", () => {
    console.log("User disconnected ❌", socket.id);
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