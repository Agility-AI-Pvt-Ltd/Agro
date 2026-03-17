/**
 * API Gateway — Single Server Entrypoint
 *
 * This is the only process that runs in the Cloud Run container.
 * It initialises Express, applies all middleware, and mounts all service routes.
 *
 * Route map:
 *   /health     → inline health check
 *   /auth       → auth-service
 *   /farmer     → farmer-service (JWT protected)
 *   /admin      → admin routes from farmer-service (admin JWT protected)
 *   /notify     → notification-service
 *   /chatbot    → chatbot-service (JWT protected)
 */

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const logger = require("../../shared/logger");
const prisma = require("../../shared/prisma");
const { startInactiveReminderJob } = require("../../notification-service/jobs/inactiveReminder.job");

// ─── Service Routes ────────────────────────────────────────────────────────
const authRoutes = require("../../auth-service/src/auth.routes");
const farmerRoutes = require("../../farmer-service/src/farmer.routes");
const adminRoutes = require("../../farmer-service/src/admin.routes");
const notificationRoutes = require("../../notification-service/src/notification.routes");
const chatbotRoutes = require("../../chatbot-service/src/chatbot.routes");

// ─── App ───────────────────────────────────────────────────────────────────
const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: "*",
  credentials: true
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(limiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// ─── Request Logger ────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// ─── Health Check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Mount Service Routes ──────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/farmer", farmerRoutes);
app.use("/admin", adminRoutes);
app.use("/notify", notificationRoutes);
app.use("/chatbot", chatbotRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error("[Gateway] Unhandled error", { error: err.message, stack: err.stack });
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    logger.info("[Gateway] Database connected");

    // Start background jobs
    if (process.env.NODE_ENV !== "test") {
      startInactiveReminderJob();
    }

    app.listen(PORT, () => {
      logger.info(`[Gateway] Server running on port ${PORT}`, {
        env: process.env.NODE_ENV,
        port: PORT,
      });
    });
  } catch (err) {
    logger.error("[Gateway] Failed to start server", { error: err.message });
    await prisma.$disconnect();
    process.exit(1);
  }
}

// ─── Graceful Shutdown ─────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  logger.info("[Gateway] SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("[Gateway] SIGINT received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

start();
