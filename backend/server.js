require("dotenv").config({
  path: __dirname + "/.env"
});

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ===== Middleware =====
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());

// ===== DB Connection =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// ===== Basic Route =====
app.get("/", (req, res) => {
  res.send("🚀 Backend Running");
});

// ===== ONLY Import Existing Routes =====
const groupRoutes = require("./routes/groupRoutes");
app.use("/api/groups", groupRoutes);

// ===== Socket Setup =====
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

require("./socket")(io);

// ===== Start Server =====
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});