const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const emergencyRoutes = require("./routes/emergencyRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/emergency", emergencyRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("User connected 🔌");
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT} 🚀`);
});
