const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const locationRoutes = require("./routes/locationRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const hazardRoutes = require("./routes/hazardRoutes");
// ✅ Import ONCE
const { saveMessage, getMessages } = require("./models/MessageModel");



const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/emergency", emergencyRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/hazards", hazardRoutes);

// 🔹 Create HTTP server
const server = http.createServer(app);

// 🔹 Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


// ===============================
// 🔹 SOCKET CONNECTION LOGIC
// ===============================
io.on("connection", (socket) => {
  console.log("User connected 🔌", socket.id);

  // ✅ When user joins emergency chat
  socket.on("joinEmergency", (username) => {
    socket.username = username;
    console.log(`${username} joined emergency`);
  });

  // ===============================
  // 💬 NORMAL MESSAGE
  // ===============================
  socket.on("sendMessage", (data) => {

    const messageData = {
      username: data.username || "Anonymous",
      message: data.message,
      location: data.location || null,
      type: "normal",
      timestamp: new Date()
    };

    // Save to DB
    saveMessage(messageData, (err) => {
      if (err) console.log("DB Save Error:", err);
    });

    // Broadcast to all users
    io.emit("receiveMessage", messageData);
  });


  // ===============================
  // 🚨 PANIC ALERT
  // ===============================
  socket.on("panicActivated", (data) => {

    const alertData = {
      username: data.username || "User",
      message: "🚨 PANIC ALERT ACTIVATED!",
      location: data.location || null,
      type: "alert",
      timestamp: new Date()
    };

    // Save to DB
    saveMessage(alertData, (err) => {
      if (err) console.log("DB Save Error:", err);
    });

    // Broadcast to everyone
    io.emit("receiveMessage", alertData);
  });


  // ===============================
  // 📜 LOAD OLD MESSAGES (NEW)
  // ===============================
  socket.on("loadMessages", () => {
    getMessages((err, messages) => {
      if (err) {
        console.log("DB Fetch Error:", err);
      } else {
        socket.emit("previousMessages", messages);
      }
    });
  });


  // 🔴 Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected ❌", socket.id);
  });

});


// 🔹 Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});