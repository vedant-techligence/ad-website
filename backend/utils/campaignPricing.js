const PricingConfig = require("../models/PricingConfig");

async function getConfig() {
  let config = await PricingConfig.findOne().sort({ updatedAt: -1 });
  if (!config) config = await PricingConfig.create({});
  return config;
}

// Formula:
// baseCost      = durationDays × repeatRate × baseRatePerDay
// adjustedCost  = baseCost × placementMultiplier
// withFee       = adjustedCost + platformFee
// gst           = withFee × gstRate
// total         = withFee + gst
async function calculateCampaignEstimate({ startDate, endDate, repeatRate, dailyBudgetCap, placement }) {
  const config = await getConfig();

  const msPerDay = 1000 * 60 * 60 * 24;
  const durationDays = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / msPerDay));
  const repeatRateNum = Number(repeatRate) || config.defaultRepeatRate;
  const dailyBudgetCapNum = Number(dailyBudgetCap) || 0;

  const placementKey = (placement || "other").toLowerCase().replace(/\s+/g, "_");
  const placementMult = config.placementMultipliers?.[placementKey] ?? 1.0;

  const baseCost = durationDays * repeatRateNum * config.baseRatePerDay;
  const adjustedCost = baseCost * placementMult;
  const withFee = adjustedCost + config.platformFee;
  const gst = withFee * config.gstRate;
  const estimatedCost = Math.round(withFee + gst);
  const avgDailyCost = Math.round((estimatedCost / durationDays) * 100) / 100;

  let budgetWarning = null;
  if (dailyBudgetCapNum && avgDailyCost > dailyBudgetCapNum) {
    budgetWarning = `Estimated daily cost (₹${avgDailyCost}) exceeds your daily budget cap (₹${dailyBudgetCapNum}).`;
  }

  return {
    durationDays,
    breakdown: {
      baseRatePerDay: config.baseRatePerDay,
      repeatRate: repeatRateNum,
      baseCost: Math.round(baseCost),
      placementMultiplier: placementMult,
      adjustedCost: Math.round(adjustedCost),
      platformFee: config.platformFee,
      gst: Math.round(gst),
      estimatedCost,
    },
    avgDailyCost,
    budgetWarning,
  };
}

module.exports = { calculateCampaignEstimate, getConfig };
