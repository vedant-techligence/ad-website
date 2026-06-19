// Pricing configuration for campaign cost estimation.
// All values are in INR. Change these when real pricing is finalized —
// nothing else in the codebase needs to change.

const PRICING = {
  baseRatePerDay: 500, // flat rate per day of campaign duration
  repeatRateMultiplier: 0.1, // extra 10% per unit of repeat rate above 1
  platformFee: 500, // flat one-time platform fee per campaign
  gstRate: 0.18, // 18% GST applied to (subtotal + platformFee)
};

/**
 * Calculates the full cost breakdown for a campaign.
 * @param {number} durationDays - number of days between startDate and endDate
 * @param {number} repeatRate   - plays per user per day (1-20)
 * @returns {{ breakdown, totalPaise }} — breakdown in INR, totalPaise for Razorpay
 */
const calculateCost = (durationDays, repeatRate) => {
  const baseAmount = PRICING.baseRatePerDay * durationDays;
  const repeatMultiplier = 1 + (repeatRate - 1) * PRICING.repeatRateMultiplier;
  const subtotal = baseAmount * repeatMultiplier;
  const withFee = subtotal + PRICING.platformFee;
  const gstAmount = withFee * PRICING.gstRate;
  const total = Math.round(withFee + gstAmount);

  return {
    breakdown: {
      baseRate: PRICING.baseRatePerDay,
      durationDays,
      repeatRateMultiplier: repeatMultiplier,
      platformFee: PRICING.platformFee,
      gstAmount: Math.round(gstAmount),
    },
    totalINR: total,
    totalPaise: total * 100, // Razorpay expects smallest currency unit
  };
};

module.exports = { PRICING, calculateCost };
