/**
 * Chatbot Routes
 *
 * Mounted at: /chatbot
 * Requires JWT authentication.
 */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../shared/middlewares/auth");
const chatController = require("./controllers/chatController");

router.post("/custom", requireAuth, chatController.handleCustomChat);
router.post("/predefined", requireAuth, chatController.handlePredefinedChat);

module.exports = router;
