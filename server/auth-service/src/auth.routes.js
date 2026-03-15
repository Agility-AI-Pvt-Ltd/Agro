/**
 * Auth Routes
 *
 * Mounted at: /auth
 *
 * Public routes (no auth required):
 *   POST /auth/register/send-otp
 *   POST /auth/register/verify
 *   POST /auth/login/send-otp
 *   POST /auth/login/verify
 *   POST /auth/refresh
 *   POST /auth/admin/login
 *
 * Protected routes (JWT required):
 *   POST /auth/logout
 */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../shared/middlewares/auth");
const ctrl = require("./auth.controller");

// Registration
router.post("/register/send-otp", ctrl.registerSendOtp);
router.post("/register/verify", ctrl.registerVerify);

// Login
router.post("/login/send-otp", ctrl.loginSendOtp);
router.post("/login/verify", ctrl.loginVerify);

// Token management
router.post("/refresh", ctrl.refresh);
router.post("/logout", requireAuth, ctrl.logout);

// Admin login — validates env credentials, returns admin JWT
router.post("/admin/login", ctrl.adminLogin);

module.exports = router;
