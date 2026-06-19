const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { adminMiddleware } = require("../middleware/admin");

router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Analytics routes — PLACEHOLDER MODULE
 *
 * These routes are intentionally stubbed out.
 * Full implementation will be built by Anshul & Yash as part of
 * Task B: Campaign Analytics & Insights Page.
 *
 * When integrating:
 * - Import CampaignAnalytics model
 * - Replace the stub responses below with real aggregation queries
 * - The route paths below are suggestions 
 *
 * Data the analytics system will likely need from our side:
 * - Campaign._id, Campaign.status, Campaign.startDate, Campaign.endDate
 * - Campaign.repeatRate, Campaign.targeting
 * - Robot.location, Robot.assignedCampaigns
 * - Payment.amount, Payment.status
 *
 * All these are already available in MongoDB Atlas via the shared cluster.
 */

// GET /api/admin/analytics/overview
router.get("/overview", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Analytics overview — integration pending.",
    data: {
      totalImpressions: null,
      totalDisplays: null,
      activeRobots: null,
      totalReach: null,
    },
  });
});

// GET /api/admin/analytics/campaigns/:campaignId
router.get("/campaigns/:campaignId", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Per-campaign analytics — integration pending.",
    data: {
      campaignId: _req.params.campaignId,
      impressions: null,
      sentiment: { positive: null, neutral: null, negative: null },
      healthScore: null,
    },
  });
});

// GET /api/admin/analytics/geo
router.get("/geo", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Geo analytics — integration pending.",
    data: {
      robotLocations: [],
      topPerformingLocations: [],
    },
  });
});

module.exports = router;
