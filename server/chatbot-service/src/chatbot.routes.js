/**
 * Chatbot Routes
 *
 * Mounted at: /chatbot
 * Requires JWT authentication.
 *
 * Current state: PLACEHOLDER
 *   Returns a mock response indicating AI integration is pending.
 *
 * Future AI integration:
 *   1. Receive farmer's natural language query
 *   2. Enrich with farmer profile + crop context from DB
 *   3. Call Google Vertex AI / Gemini API
 *   4. Store query + response in advisory_queries or market_queries table
 *   5. Return structured AI reply
 *
 * Route:
 *   POST /chatbot/message
 */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../shared/middlewares/auth");
const { logActivity } = require("../../shared/activity");
const logger = require("../../shared/logger");

router.post("/message", requireAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    await logActivity(userId, "chatbot_message", "/chatbot/message", { message });

    // TODO: Replace with actual AI integration (Vertex AI / Gemini)
    return res.status(200).json({
      success: true,
      data: {
        status: "mock",
        reply: "AI chatbot integration pending",
      },
    });
  } catch (err) {
    logger.error("[Chatbot] message failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Chatbot error" });
  }
});

module.exports = router;
