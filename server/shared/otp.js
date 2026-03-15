/**
 * OTP Utilities
 *
 * - Generates a 6-digit numeric OTP
 * - Hashes OTP using bcrypt before DB storage
 * - Verifies plaintext OTP against stored hash
 */

const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;
const OTP_TTL_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60;

/**
 * Generate a 6-digit numeric OTP string.
 * @returns {string} e.g. "048291"
 */
function generateOtp() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

/**
 * Hash an OTP with bcrypt.
 * @param {string} otp
 * @returns {Promise<string>} bcrypt hash
 */
async function hashOtp(otp) {
  return bcrypt.hash(otp, SALT_ROUNDS);
}

/**
 * Compare a plaintext OTP against a bcrypt hash.
 * @param {string} plaintext
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyOtp(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Returns the OTP expiry Date (now + TTL).
 * @returns {Date}
 */
function getOtpExpiry() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_TTL_MINUTES);
  return d;
}

/**
 * Returns the cooldown cutoff Date (now - cooldown seconds).
 * If a recent OTP was created AFTER this date, reject the request.
 * @returns {Date}
 */
function getCooldownCutoff() {
  const d = new Date();
  d.setSeconds(d.getSeconds() - OTP_COOLDOWN_SECONDS);
  return d;
}

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
  getOtpExpiry,
  getCooldownCutoff,
  OTP_TTL_MINUTES,
  OTP_COOLDOWN_SECONDS,
};
