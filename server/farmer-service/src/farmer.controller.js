/**
 * Farmer Controller
 *
 * NOTE: Prisma schema uses snake_case field names.
 *   user_id, location_lat, location_lng, crop_type, sowing_date,
 *   expected_harvest_date, area_acres, last_active_at, created_at
 */

const prisma = require("../../shared/prisma");
const { logActivity } = require("../../shared/activity");
const logger = require("../../shared/logger");

// ─────────────────────────────────────────────
// GET /farmer/profile
// ─────────────────────────────────────────────
async function getProfile(req, res) {
  try {
    const { userId } = req.user;

    const profile = await prisma.farmerProfile.findUnique({
      where: { user_id: userId },                  // ← snake_case
      include: {
        user: {
          select: { phone: true, is_verified: true, last_active_at: true, created_at: true },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Farmer profile not found" });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    logger.error("[Farmer] getProfile failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
}

// ─────────────────────────────────────────────
// PUT /farmer/profile
// ─────────────────────────────────────────────
async function updateProfile(req, res) {
  try {
    const { userId } = req.user;
    const { name, location_lat, location_lng, address } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (location_lat !== undefined) updateData.location_lat = parseFloat(location_lat);   // ← snake_case
    if (location_lng !== undefined) updateData.location_lng = parseFloat(location_lng);   // ← snake_case
    if (address !== undefined) updateData.address = address;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const profile = await prisma.farmerProfile.update({
      where: { user_id: userId },                  // ← snake_case
      data: updateData,
    });

    await logActivity(userId, "profile_update", "/farmer/profile", updateData);
    await prisma.user.update({ where: { id: userId }, data: { last_active_at: new Date() } });  // ← snake_case

    return res.status(200).json({ success: true, message: "Profile updated", data: profile });
  } catch (err) {
    logger.error("[Farmer] updateProfile failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
}

// ─────────────────────────────────────────────
// GET /farmer/crops
// ─────────────────────────────────────────────
async function getCrops(req, res) {
  try {
    const { userId } = req.user;

    const crops = await prisma.crop.findMany({
      where: { user_id: userId },                  // ← snake_case
      orderBy: { created_at: "desc" },             // ← snake_case
    });

    return res.status(200).json({ success: true, data: crops });
  } catch (err) {
    logger.error("[Farmer] getCrops failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to fetch crops" });
  }
}

// ─────────────────────────────────────────────
// POST /farmer/crops
// ─────────────────────────────────────────────
async function addCrop(req, res) {
  try {
    const { userId } = req.user;
    const { crop_type, sowing_date, expected_harvest_date, area_acres } = req.body;

    if (!crop_type || !sowing_date) {
      return res.status(400).json({ success: false, message: "crop_type and sowing_date are required" });
    }

    const crop = await prisma.crop.create({
      data: {
        user_id: userId,                                                        // ← snake_case
        crop_type,                                                              // ← snake_case
        sowing_date: new Date(sowing_date),                                     // ← snake_case
        expected_harvest_date: expected_harvest_date ? new Date(expected_harvest_date) : null, // ← snake_case
        area_acres: area_acres ? parseFloat(area_acres) : null,                 // ← snake_case
      },
    });

    await logActivity(userId, "crop_added", "/farmer/crops", { crop_type });
    await prisma.user.update({ where: { id: userId }, data: { last_active_at: new Date() } });  // ← snake_case

    return res.status(201).json({ success: true, message: "Crop added", data: crop });
  } catch (err) {
    logger.error("[Farmer] addCrop failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to add crop" });
  }
}

// ─────────────────────────────────────────────
// PUT /farmer/crops/:id
// ─────────────────────────────────────────────
async function updateCrop(req, res) {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { crop_type, sowing_date, expected_harvest_date, area_acres, status } = req.body;

    const existing = await prisma.crop.findFirst({ where: { id, user_id: userId } });  // ← snake_case
    if (!existing) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    const updateData = {};
    if (crop_type !== undefined) updateData.crop_type = crop_type;
    if (sowing_date !== undefined) updateData.sowing_date = new Date(sowing_date);
    if (expected_harvest_date !== undefined) updateData.expected_harvest_date = new Date(expected_harvest_date);
    if (area_acres !== undefined) updateData.area_acres = parseFloat(area_acres);
    if (status !== undefined) updateData.status = status;

    const crop = await prisma.crop.update({ where: { id }, data: updateData });

    await logActivity(userId, "crop_updated", `/farmer/crops/${id}`, { cropId: id, ...updateData });
    await prisma.user.update({ where: { id: userId }, data: { last_active_at: new Date() } });  // ← snake_case

    return res.status(200).json({ success: true, message: "Crop updated", data: crop });
  } catch (err) {
    logger.error("[Farmer] updateCrop failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to update crop" });
  }
}

// ─────────────────────────────────────────────
// POST /farmer/activity
// ─────────────────────────────────────────────
async function trackActivity(req, res) {
  try {
    const { userId } = req.user;
    const { action, endpoint, metadata } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, message: "action is required" });
    }

    await logActivity(userId, action || "page_visit", endpoint || null, metadata || null);
    await prisma.user.update({ where: { id: userId }, data: { last_active_at: new Date() } });  // ← snake_case

    return res.status(200).json({ success: true, message: "Activity logged" });
  } catch (err) {
    logger.error("[Farmer] trackActivity failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to log activity" });
  }
}

module.exports = { getProfile, updateProfile, getCrops, addCrop, updateCrop, trackActivity };
