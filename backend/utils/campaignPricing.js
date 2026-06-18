const pricingConfig = require("../config/pricing");

// Shared by campaign creation (computed once, locked in at creation time)
// and the manual POST /:id/estimate endpoint (kept around for recomputing
// a draft if config/pricing.js changes before payment). Both call this so
// the math can never drift between the two call sites.
function calculateCampaignEstimate({
  startDate,
  endDate,
  repeatRate,
  dailyBudgetCap,
}) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const durationDays = Math.max(
    1,
    Math.ceil((new Date(endDate) - new Date(startDate)) / msPerDay),
  );

  const { BASE_RATE_PER_REPEAT_PER_DAY, PLATFORM_FEE_PERCENT, GST_PERCENT } =
    pricingConfig;

  const baseCost = durationDays * repeatRate * BASE_RATE_PER_REPEAT_PER_DAY;
  const platformFee = (baseCost * PLATFORM_FEE_PERCENT) / 100;
  const subtotal = baseCost + platformFee;
  const gst = (subtotal * GST_PERCENT) / 100;
  const estimatedCost = Math.round(subtotal + gst);

  const avgDailyCost = Math.round((estimatedCost / durationDays) * 100) / 100;

  let budgetWarning = null;
  if (dailyBudgetCap && avgDailyCost > dailyBudgetCap) {
    budgetWarning = `Estimated average daily cost (₹${avgDailyCost}) exceeds your dailyBudgetCap (₹${dailyBudgetCap}).`;
  }

  return {
    durationDays,
    breakdown: { baseCost, platformFee, gst, estimatedCost },
    avgDailyCost,
    budgetWarning,
  };
}

module.exports = { calculateCampaignEstimate };
