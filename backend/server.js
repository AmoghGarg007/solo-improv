const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* ===== OPTIONAL MONGO CONNECTION ===== */
/* Comment this out if Mongo not running */

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("Mongo not connected (using memory mode)"));
}

/* ===== ROUTES ===== */
const eventRoutes = require("./routes/eventRoutes");
app.use("/api/events", eventRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

require("./sockets/chatSocket")(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});