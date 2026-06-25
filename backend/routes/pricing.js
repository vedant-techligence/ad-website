const express = require("express");
const PricingConfig = require("../models/PricingConfig");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET current pricing config (admin + users for estimate calculation)
router.get("/", authMiddleware, async (_req, res) => {
  try {
    let config = await PricingConfig.findOne().sort({ updatedAt: -1 });
    if (!config) config = await PricingConfig.create({});
    res.status(200).json(config);
  } catch {
    res.status(500).json({ message: "Failed to fetch pricing config." });
  }
});

// PUT update pricing config (admin only)
router.put("/", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const {
      baseRatePerDay, platformFee, gstRate,
      defaultDurationDays, defaultRepeatRate, minRepeatRate, maxRepeatRate,
      placementMultipliers,
    } = req.body;

    let config = await PricingConfig.findOne().sort({ updatedAt: -1 });
    if (!config) config = new PricingConfig();

    if (baseRatePerDay !== undefined) config.baseRatePerDay = baseRatePerDay;
    if (platformFee !== undefined) config.platformFee = platformFee;
    if (gstRate !== undefined) config.gstRate = gstRate;
    if (defaultDurationDays !== undefined) config.defaultDurationDays = defaultDurationDays;
    if (defaultRepeatRate !== undefined) config.defaultRepeatRate = defaultRepeatRate;
    if (minRepeatRate !== undefined) config.minRepeatRate = minRepeatRate;
    if (maxRepeatRate !== undefined) config.maxRepeatRate = maxRepeatRate;
    if (placementMultipliers) config.placementMultipliers = { ...config.placementMultipliers.toObject(), ...placementMultipliers };
    config.updatedBy = req.user.email;

    await config.save();
    res.status(200).json(config);
  } catch (err) {
    res.status(500).json({ message: "Failed to update pricing config." });
  }
});

module.exports = router;
