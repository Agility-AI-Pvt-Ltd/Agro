/**
 * Admin Controller
 *
 * NOTE: Prisma schema uses snake_case field names.
 *   user_id, created_at, last_active_at, location_lat, location_lng,
 *   crop_type, sowing_date, is_verified, farmer_profile (relation: profile)
 */

const prisma = require("../../shared/prisma");
const logger = require("../../shared/logger");

// ─────────────────────────────────────────────
// GET /admin/stats
// ─────────────────────────────────────────────
async function getStats(req, res) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalFarmers, dailyRegistrations, activeUserIds] = await Promise.all([
      prisma.user.count(),

      // Farmers who registered today
      prisma.activityLog.count({
        where: {
          action: "register",
          created_at: { gte: startOfToday },    // ← snake_case
        },
      }),

      // Distinct users active in last 24 hours
      prisma.activityLog.findMany({
        where: { created_at: { gte: twentyFourHoursAgo } },  // ← snake_case
        select: { user_id: true },                             // ← snake_case
        distinct: ["user_id"],                                 // ← snake_case
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalFarmers,
        dailyRegistrations,
        activeUsers: activeUserIds.length,
      },
    });
  } catch (err) {
    logger.error("[Admin] getStats failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
}

// ─────────────────────────────────────────────
// GET /admin/users  (paginated)
// ─────────────────────────────────────────────
async function getUsers(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { created_at: "desc" },          // ← snake_case
        select: {
          id: true,
          phone: true,
          is_verified: true,                        // ← snake_case
          last_active_at: true,                     // ← snake_case
          created_at: true,                         // ← snake_case
          profile: {                                // ← relation name from schema
            select: { name: true, location_lat: true, location_lng: true, address: true },
          },
        },
      }),
      prisma.user.count(),
    ]);

    // Normalise the response so frontend gets a consistent `farmerProfile` key
    const normalised = users.map((u) => ({
      ...u,
      farmerProfile: u.profile,
    }));

    return res.status(200).json({
      success: true,
      data: normalised,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error("[Admin] getUsers failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
}

// ─────────────────────────────────────────────
// GET /admin/activity  (paginated, filterable)
// ─────────────────────────────────────────────
async function getActivity(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;
    const actionFilter = req.query.action || undefined;

    const where = actionFilter ? { action: actionFilter } : {};

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },           // ← snake_case
        include: {
          user: {
            select: {
              phone: true,
              profile: { select: { name: true } }, // ← relation name
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Normalise user.profile → user.farmerProfile for frontend
    const normalised = logs.map((log) => ({
      ...log,
      user: log.user
        ? { ...log.user, farmerProfile: log.user.profile }
        : null,
    }));

    return res.status(200).json({
      success: true,
      data: normalised,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error("[Admin] getActivity failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to fetch activity" });
  }
}

// ─────────────────────────────────────────────
// GET /admin/crops
// ─────────────────────────────────────────────
async function getCropAnalytics(req, res) {
  try {
    const [byType, byStatus] = await Promise.all([
      prisma.crop.groupBy({
        by: ["crop_type"],                         // ← snake_case
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),

      prisma.crop.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        byType: byType.map((r) => ({ cropType: r.crop_type, count: r._count.id })),
        byStatus: byStatus.map((r) => ({ status: r.status, count: r._count.id })),
      },
    });
  } catch (err) {
    logger.error("[Admin] getCropAnalytics failed", { error: err.message });
    return res.status(500).json({ success: false, message: "Failed to fetch crop analytics" });
  }
}

module.exports = { getStats, getUsers, getActivity, getCropAnalytics };
