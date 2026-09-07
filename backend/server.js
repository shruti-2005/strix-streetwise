require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { initSockets } = require("./sockets/index");

const authRoutes = require("./routes/auth");
const issueRoutes = require("./routes/issues");
const authorityRoutes = require("./routes/authority");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});
initSockets(io);

// --- Middleware ---
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Serve uploaded issue images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "strix-backend", time: new Date().toISOString() });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/authority", authorityRoutes);

// --- Error handling ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[server] Strix backend running on http://localhost:${PORT}`);
    console.log(`[server] Socket.io ready, CORS allowed for ${CLIENT_URL}`);
  });
});
