/**
 * Farmer Routes
 *
 * Mounted at: /farmer
 * All routes require JWT authentication.
 *
 * Routes:
 *   GET  /farmer/profile
 *   PUT  /farmer/profile
 *   GET  /farmer/crops
 *   POST /farmer/crops
 *   PUT  /farmer/crops/:id
 *
 * Activity tracking:
 *   POST /farmer/activity  — log frontend page visits
 */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../shared/middlewares/auth");
const ctrl = require("./farmer.controller");

// All farmer routes require authentication
router.use(requireAuth);

// Profile
router.get("/profile", ctrl.getProfile);
router.put("/profile", ctrl.updateProfile);

// Crops
router.get("/crops", ctrl.getCrops);
router.post("/crops", ctrl.addCrop);
router.put("/crops/:id", ctrl.updateCrop);

// Frontend activity tracking
router.post("/activity", ctrl.trackActivity);

module.exports = router;
