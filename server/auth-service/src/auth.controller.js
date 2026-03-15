/**
 * Auth Controller
 *
 * Handles all authentication logic:
 *   - Registration (send OTP + verify)
 *   - Login (send OTP + verify)
 *   - Token refresh (token_id rotation)
 *   - Logout (revoke refresh token)
 *   - Admin login (env credential check → admin JWT)
 *
 * NOTE: Prisma schema uses snake_case field names throughout.
 *   user_id, created_at, expires_at, token_id, is_verified, last_active_at
 */

const prisma = require("../../shared/prisma");
const { sendOtpSms } = require("../../shared/sms");
const { generateOtp, hashOtp, verifyOtp, getOtpExpiry, getCooldownCutoff } = require("../../shared/otp");
const { signAccessToken, signRefreshToken, signAdminToken, verifyToken, getRefreshTokenExpiryDate } = require("../../shared/jwt");
const { logActivity } = require("../../shared/activity");
const logger = require("../../shared/logger");

// ─────────────────────────────────────────────
// Helper: check OTP cooldown then generate + send
// ─────────────────────────────────────────────
async function generateAndSendOtp(phone, purpose) {
  // 60-second cooldown
  const cooldownCutoff = getCooldownCutoff();
  const recentOtp = await prisma.otp.findFirst({
    where: {
      phone,
      purpose,
      used: false,
      created_at: { gte: cooldownCutoff },   // ← snake_case
    },
    orderBy: { created_at: "desc" },           // ← snake_case
  });

  if (recentOtp) {
    const secondsSince = Math.floor((Date.now() - new Date(recentOtp.created_at).getTime()) / 1000);
    const waitSeconds = 60 - secondsSince;
    throw Object.assign(
      new Error(`OTP already sent. Please wait ${waitSeconds} seconds before requesting a new one.`),
      { statusCode: 429, code: "OTP_COOLDOWN" }
    );
  }

  // Mark all previous unused OTPs as used
  await prisma.otp.updateMany({
    where: { phone, purpose, used: false },
    data: { used: true },
  });

  // Generate and store new OTP
  const otp = generateOtp();
  const hash = await hashOtp(otp);
  await prisma.otp.create({
    data: {
      phone,
      hash,
      purpose,
      expires_at: getOtpExpiry(),           // ← snake_case
    },
  });

  await sendOtpSms(phone, otp);
  return otp;
}

// ─────────────────────────────────────────────
// Helper: issue a fresh token pair
// ─────────────────────────────────────────────
async function issueTokenPair(userId) {
  const accessToken = signAccessToken(userId);
  const { token: refreshToken, tokenId } = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: {
      user_id: userId,                          // ← snake_case
      token_id: tokenId,                        // ← snake_case
      expires_at: getRefreshTokenExpiryDate(),  // ← snake_case
    },
  });

  return { accessToken, refreshToken };
}

// ─────────────────────────────────────────────
// POST /auth/register/send-otp
// ─────────────────────────────────────────────
async function registerSendOtp(req, res) {
  try {
    const { phone, name, location_lat, location_lng, main_crop, sowing_date } = req.body;

    if (!phone || !name || !main_crop || !sowing_date) {
      return res.status(400).json({ success: false, message: "phone, name, main_crop, and sowing_date are required" });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Phone number already registered" });
    }

    await generateAndSendOtp(phone, "register");

    return res.status(200).json({ success: true, message: "OTP sent to your phone number" });
  } catch (err) {
    if (err.code === "OTP_COOLDOWN") {
      return res.status(429).json({ success: false, message: err.message, code: err.code });
    }
    logger.error("[Auth] registerSendOtp failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
}

// ─────────────────────────────────────────────
// POST /auth/register/verify
// ─────────────────────────────────────────────
async function registerVerify(req, res) {
  try {
    const { phone, otp, name, location_lat, location_lng, main_crop, sowing_date } = req.body;

    if (!phone || !otp || !name || !main_crop || !sowing_date) {
      return res.status(400).json({ success: false, message: "phone, otp, name, main_crop, and sowing_date are required" });
    }

    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone,
        purpose: "register",
        used: false,
        expires_at: { gte: new Date() },    // ← snake_case
      },
      orderBy: { created_at: "desc" },       // ← snake_case
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }

    const isValid = await verifyOtp(otp, otpRecord.hash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    await prisma.otp.update({ where: { id: otpRecord.id }, data: { used: true } });

    // Create user + farmer profile + initial crop in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { phone },
      });

      await tx.farmerProfile.create({
        data: {
          user_id: newUser.id,               // ← snake_case
          name,
          phone,
          location_lat: location_lat ? parseFloat(location_lat) : null,   // ← snake_case
          location_lng: location_lng ? parseFloat(location_lng) : null,   // ← snake_case
        },
      });

      await tx.crop.create({
        data: {
          user_id: newUser.id,               // ← snake_case
          crop_type: main_crop,              // ← snake_case
          sowing_date: new Date(sowing_date), // ← snake_case
        },
      });

      return newUser;
    });

    const { accessToken, refreshToken } = await issueTokenPair(user.id);
    await logActivity(user.id, "register", "/auth/register/verify", { phone });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { accessToken, refreshToken, userId: user.id },
    });
  } catch (err) {
    logger.error("[Auth] registerVerify failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
}

// ─────────────────────────────────────────────
// POST /auth/login/send-otp
// ─────────────────────────────────────────────
async function loginSendOtp(req, res) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: "phone is required" });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this phone number" });
    }

    // Note: schema has is_verified, not isActive
    // We treat unverified accounts as inactive for login
    // (no deactivation column in this schema, so skip that check)

    await generateAndSendOtp(phone, "login");

    return res.status(200).json({ success: true, message: "OTP sent to your phone number" });
  } catch (err) {
    if (err.code === "OTP_COOLDOWN") {
      return res.status(429).json({ success: false, message: err.message, code: err.code });
    }
    logger.error("[Auth] loginSendOtp failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
}

// ─────────────────────────────────────────────
// POST /auth/login/verify
// ─────────────────────────────────────────────
async function loginVerify(req, res) {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: "phone and otp are required" });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone,
        purpose: "login",
        used: false,
        expires_at: { gte: new Date() },    // ← snake_case
      },
      orderBy: { created_at: "desc" },       // ← snake_case
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }

    const isValid = await verifyOtp(otp, otpRecord.hash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    await prisma.otp.update({ where: { id: otpRecord.id }, data: { used: true } });

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { last_active_at: new Date() },   // ← snake_case
    });

    const { accessToken, refreshToken } = await issueTokenPair(user.id);
    await logActivity(user.id, "login", "/auth/login/verify", { phone });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { accessToken, refreshToken, userId: user.id },
    });
  } catch (err) {
    logger.error("[Auth] loginVerify failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Login failed" });
  }
}

// ─────────────────────────────────────────────
// POST /auth/refresh
// ─────────────────────────────────────────────
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "refreshToken is required" });
    }

    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    const { userId, tokenId } = decoded;

    if (!userId || !tokenId) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token_id: tokenId },               // ← snake_case
    });

    if (!tokenRecord || tokenRecord.revoked || new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(401).json({ success: false, message: "Refresh token is invalid or has been revoked" });
    }

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await issueTokenPair(userId);

    return res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    logger.error("[Auth] refresh failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Token refresh failed" });
  }
}

// ─────────────────────────────────────────────
// POST /auth/logout
// ─────────────────────────────────────────────
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      try {
        const decoded = verifyToken(refreshToken);
        if (decoded.tokenId) {
          await prisma.refreshToken.updateMany({
            where: { token_id: decoded.tokenId },   // ← snake_case
            data: { revoked: true },
          });
        }
      } catch (_) {
        // Token already expired — still respond 200
      }
    }

    if (req.user?.userId) {
      await logActivity(req.user.userId, "logout", "/auth/logout");
    }

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    logger.error("[Auth] logout failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
}

// ─────────────────────────────────────────────
// POST /auth/admin/login
// ─────────────────────────────────────────────
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "username and password are required" });
    }

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validUsername || !validPassword) {
      logger.error("[Auth] Admin credentials not configured in env");
      return res.status(503).json({ success: false, message: "Admin login not configured" });
    }

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    const adminToken = signAdminToken();

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: { adminToken },
    });
  } catch (err) {
    logger.error("[Auth] adminLogin failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Admin login failed" });
  }
}

module.exports = {
  registerSendOtp,
  registerVerify,
  loginSendOtp,
  loginVerify,
  refresh,
  logout,
  adminLogin,
};
