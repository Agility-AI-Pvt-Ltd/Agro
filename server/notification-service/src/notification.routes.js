/**
 * Notification Routes
 *
 * Mounted at: /notify
 *
 * This service exposes a minimal HTTP interface.
 * The primary notification logic runs as a cron job:
 *   notification-service/jobs/inactiveReminder.job.js
 *
 * Route:
 *   GET /notify/status — health/status of notification service
 */

const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../../shared/middlewares/admin");

router.get("/status", requireAdmin, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Notification service is running",
    info: "Inactive user reminder cron runs every hour.",
  });
});

module.exports = router;
