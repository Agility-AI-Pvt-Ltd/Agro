/**
 * Activity Logging Helper
 *
 * Centralised helper for inserting activity_logs records.
 * Used by all services to track important user actions.
 *
 * Tracked actions:
 *   register, login, logout, profile_update,
 *   crop_added, crop_updated, chatbot_message, page_visit
 *
 * Admin analytics queries this table to power:
 *   - Daily registrations count
 *   - Active users (last 24h)
 *   - Recent activity feed
 */

const prisma = require("./prisma");
const logger = require("./logger");

/**
 * Log a user activity.
 * @param {string} userId    - UUID of the user performing the action
 * @param {string} action    - Action name, e.g. "login", "crop_added"
 * @param {string} [endpoint] - Request path, e.g. "/farmer/crops"
 * @param {object} [metadata] - Optional extra context (stored as JSONB)
 * @returns {Promise<void>}
 */
async function logActivity(userId, action, endpoint = null, metadata = null) {
  try {
    await prisma.activityLog.create({
      data: {
        user_id: userId,               // ← snake_case
        action,
        endpoint: endpoint || "",      // endpoint is non-nullable String in schema
        metadata: metadata || undefined,
      },
    });
  } catch (err) {
    // Activity logging failures must never crash the main request.
    logger.warn("[Activity] Failed to log activity", {
      userId,
      action,
      error: err.message,
    });
  }
}

module.exports = { logActivity };
