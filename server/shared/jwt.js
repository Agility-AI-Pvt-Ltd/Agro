/**
 * JWT Utilities
 *
 * Access Token  — short-lived (15m), contains { userId }
 * Refresh Token — long-lived (7d),  contains { userId, tokenId }
 *                 tokenId is stored in the DB; revoked by deleting/flagging the row.
 * Admin Token   — medium-lived (8h), contains { role: "admin" }
 */

const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const JWT_SECRET = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return process.env.JWT_SECRET;
};

/**
 * Sign a short-lived access token.
 * @param {string} userId
 * @returns {string} signed JWT
 */
function signAccessToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
}

/**
 * Sign a refresh token embedding a unique tokenId.
 * @param {string} userId
 * @returns {{ token: string, tokenId: string }}
 */
function signRefreshToken(userId) {
  const tokenId = uuidv4();
  const token = jwt.sign({ userId, tokenId }, JWT_SECRET(), {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
  return { token, tokenId };
}

/**
 * Sign a short-lived admin token (not stored in DB).
 * @returns {string} signed JWT
 */
function signAdminToken() {
  return jwt.sign({ role: "admin" }, JWT_SECRET(), {
    expiresIn: process.env.ADMIN_TOKEN_EXPIRES_IN || "8h",
  });
}

/**
 * Verify and decode any JWT.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET());
}

/**
 * Parse the number of milliseconds from a refresh token expiry string.
 * e.g. "7d" → 7 * 24 * 60 * 60 * 1000
 */
function getRefreshTokenExpiry() {
  const raw = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const [, num, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return parseInt(num) * multipliers[unit];
}

/**
 * Returns the refresh token DB expiry as a Date object.
 */
function getRefreshTokenExpiryDate() {
  return new Date(Date.now() + getRefreshTokenExpiry());
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  signAdminToken,
  verifyToken,
  getRefreshTokenExpiryDate,
};
