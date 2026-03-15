/**
 * Admin JWT Middleware
 *
 * Validates the admin token issued by POST /auth/admin/login.
 * Admin tokens contain { role: "admin" }.
 *
 * Admin credentials are NEVER stored in the database.
 * They are validated from environment variables at login time.
 *
 * Usage:
 *   router.get("/stats", requireAdmin, controller.getStats)
 */

const { verifyToken } = require("../jwt");
const logger = require("../logger");

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Admin token required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: admin access only",
      });
    }

    req.admin = true;
    next();
  } catch (err) {
    logger.warn("[Admin] Token validation failed", { error: err.message });

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Admin token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid admin token",
    });
  }
}

module.exports = { requireAdmin };
