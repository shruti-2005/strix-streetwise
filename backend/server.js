const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);
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

// API data is operational/live data, so do not generate ETags that can turn a
// fresh dashboard request into a 304 response with an old browser body.
app.disable("etag");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});
initSockets(io);

// --- Middleware ---
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Keep operational data live; cached 304 responses can leave the authority
// dashboard showing an out-of-date report count.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});
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
