/**
 * Admin Routes
 *
 * Mounted at: /admin
 * All routes require admin JWT (role: "admin").
 * Admin token is obtained via POST /auth/admin/login.
 *
 * Routes:
 *   GET /admin/stats     — platform overview metrics
 *   GET /admin/users     — paginated farmer list
 *   GET /admin/activity  — recent activity logs
 *   GET /admin/crops     — crop distribution analytics
 */

const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../../shared/middlewares/admin");
const ctrl = require("./admin.controller");

// All admin routes require admin token
router.use(requireAdmin);

router.get("/stats", ctrl.getStats);
router.get("/users", ctrl.getUsers);
router.get("/activity", ctrl.getActivity);
router.get("/crops", ctrl.getCropAnalytics);

module.exports = router;
