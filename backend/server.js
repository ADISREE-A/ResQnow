const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const locationRoutes = require("./routes/locationRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/emergency", emergencyRoutes);
app.use("/api/location", locationRoutes);

// 🔹 Create HTTP server
const server = http.createServer(app);

// 🔹 Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🔹 Socket Connection Logic
io.on("connection", (socket) => {
  console.log("User connected 🔌", socket.id);

  // 🟢 When user joins emergency
  socket.on("joinEmergency", (username) => {
    socket.username = username;
    console.log(`${username} joined emergency`);
  });

  // 🟢 When user sends message
  socket.on("sendMessage", (data) => {
    const messageData = {
      id: Date.now(),
      username: data.username || "Anonymous",
      message: data.message,
      location: data.location || null,
      timestamp: new Date().toLocaleTimeString()
    };

    console.log("Message received:", messageData);

    // Broadcast to ALL users
    io.emit("receiveMessage", messageData);
  });

  // 🆘 Auto Emergency Alert Broadcast
  socket.on("panicActivated", (data) => {
    const alertData = {
      id: Date.now(),
      username: data.username || "User",
      message: "🚨 PANIC ALERT ACTIVATED!",
      location: data.location || null,
      timestamp: new Date().toLocaleTimeString(),
      type: "alert"
    };

    io.emit("receiveMessage", alertData);
  });

  // 🔴 Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected ❌", socket.id);
  });
});

// 🔹 Start Server
server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT} 🚀`);
});