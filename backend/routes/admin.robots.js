const express = require("express");
const router = express.Router();
const Robot = require("../models/Robot");
const { authMiddleware } = require("../middleware/auth");
const { adminMiddleware } = require("../middleware/admin");

router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/robots
 * List all robots with their current status and assigned campaigns.
 * Supports ?status=online|offline|maintenance&city=Pune
 */
router.get("/", async (req, res) => {
  try {
    const { status, city } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (city) filter["location.city"] = new RegExp(city, "i");

    const robots = await Robot.find(filter)
      .sort({ status: 1, name: 1 })
      .populate(
        "assignedCampaigns",
        "title brandName status startDate endDate",
      );

    return res
      .status(200)
      .json({ success: true, count: robots.length, data: robots });
  } catch (error) {
    console.error("Admin list robots error:", error);
    return res.status(500).json({ message: "Failed to fetch robots." });
  }
});

/**
 * GET /api/admin/robots/summary
 * Quick counts for the dashboard home — online, offline, maintenance totals.
 */
router.get("/summary", async (req, res) => {
  try {
    const summary = await Robot.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const result = { online: 0, offline: 0, maintenance: 0, total: 0 };
    summary.forEach(({ _id, count }) => {
      if (_id in result) result[_id] = count;
      result.total += count;
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Admin robots summary error:", error);
    return res.status(500).json({ message: "Failed to fetch robot summary." });
  }
});

/**
 * GET /api/admin/robots/:id
 * Single robot detail.
 */
router.get("/:id", async (req, res) => {
  try {
    const robot = await Robot.findById(req.params.id).populate(
      "assignedCampaigns",
      "title brandName status startDate endDate repeatRate",
    );

    if (!robot) {
      return res.status(404).json({ message: "Robot not found." });
    }

    return res.status(200).json({ success: true, data: robot });
  } catch (error) {
    console.error("Admin get robot error:", error);
    return res.status(500).json({ message: "Failed to fetch robot." });
  }
});

/**
 * POST /api/admin/robots
 * Register a new robot.
 * Body: { name, serialNumber, location: { label, city, latitude, longitude }, notes }
 */
router.post("/", async (req, res) => {
  try {
    const { name, serialNumber, location, notes } = req.body;

    if (!name || !serialNumber) {
      return res
        .status(400)
        .json({ message: "name and serialNumber are required." });
    }

    const existing = await Robot.findOne({ serialNumber });
    if (existing) {
      return res
        .status(400)
        .json({ message: "A robot with that serial number already exists." });
    }

    const robot = await Robot.create({ name, serialNumber, location, notes });

    return res.status(201).json({ success: true, data: robot });
  } catch (error) {
    console.error("Admin create robot error:", error);
    return res.status(500).json({ message: "Failed to register robot." });
  }
});

/**
 * PATCH /api/admin/robots/:id
 * Update a robot — status, location, notes, name.
 */
router.patch("/:id", async (req, res) => {
  try {
    const allowed = ["name", "status", "location", "notes", "lastSeenAt"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const robot = await Robot.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("assignedCampaigns", "title brandName status");

    if (!robot) {
      return res.status(404).json({ message: "Robot not found." });
    }

    return res.status(200).json({ success: true, data: robot });
  } catch (error) {
    console.error("Admin update robot error:", error);
    return res.status(500).json({ message: "Failed to update robot." });
  }
});

/**
 * POST /api/admin/robots/:id/assign
 * Assign a campaign to a robot.
 * Body: { campaignId }
 */
router.post("/:id/assign", async (req, res) => {
  try {
    const { campaignId } = req.body;
    if (!campaignId) {
      return res.status(400).json({ message: "campaignId is required." });
    }

    const robot = await Robot.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { assignedCampaigns: campaignId } }, // addToSet avoids duplicates
      { new: true },
    ).populate("assignedCampaigns", "title brandName status");

    if (!robot) {
      return res.status(404).json({ message: "Robot not found." });
    }

    return res.status(200).json({ success: true, data: robot });
  } catch (error) {
    console.error("Admin assign campaign error:", error);
    return res.status(500).json({ message: "Failed to assign campaign." });
  }
});

/**
 * POST /api/admin/robots/:id/unassign
 * Remove a campaign from a robot.
 * Body: { campaignId }
 */
router.post("/:id/unassign", async (req, res) => {
  try {
    const { campaignId } = req.body;
    if (!campaignId) {
      return res.status(400).json({ message: "campaignId is required." });
    }

    const robot = await Robot.findByIdAndUpdate(
      req.params.id,
      { $pull: { assignedCampaigns: campaignId } },
      { new: true },
    ).populate("assignedCampaigns", "title brandName status");

    if (!robot) {
      return res.status(404).json({ message: "Robot not found." });
    }

    return res.status(200).json({ success: true, data: robot });
  } catch (error) {
    console.error("Admin unassign campaign error:", error);
    return res.status(500).json({ message: "Failed to unassign campaign." });
  }
});

module.exports = router;
    