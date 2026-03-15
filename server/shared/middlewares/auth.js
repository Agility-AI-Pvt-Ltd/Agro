/**
 * JWT Authentication Middleware
 *
 * Validates Bearer token from Authorization header.
 * Attaches decoded payload as req.user = { userId }.
 *
 * Usage:
 *   router.get("/profile", requireAuth, controller.getProfile)
 */

const { verifyToken } = require("../jwt");
const logger = require("../logger");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    logger.warn("[Auth] Token validation failed", { error: err.message });

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
}

module.exports = { requireAuth };
