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
  const repeatRateNum = Number(repeatRate); 
  const dailyBudgetCapNum = Number(dailyBudgetCap);  

  const { PRICING } = pricingConfig;

  const baseCost = durationDays * repeatRateNum * PRICING.baseRatePerDay;

  const platformFee = PRICING.platformFee;

  const subtotal = baseCost + platformFee;

  const gst = subtotal * PRICING.gstRate;

  const estimatedCost = Math.round(subtotal + gst);

  const avgDailyCost = Math.round((estimatedCost / durationDays) * 100) / 100;


  let budgetWarning = null;
  if (dailyBudgetCapNum && avgDailyCost > dailyBudgetCapNum) {
    budgetWarning = `Estimated average daily cost (₹${avgDailyCost}) exceeds your dailyBudgetCap (₹${dailyBudgetCapNum}).`;
  }

  return {
    durationDays,
    breakdown: { baseCost, platformFee, gst, estimatedCost },
    avgDailyCost,
    budgetWarning,
  };
}

module.exports = { calculateCampaignEstimate };
