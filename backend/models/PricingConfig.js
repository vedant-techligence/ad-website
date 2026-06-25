const mongoose = require("mongoose");

const pricingConfigSchema = new mongoose.Schema(
  {
    baseRatePerDay: { type: Number, required: true, default: 500 },
    platformFee: { type: Number, required: true, default: 500 },
    gstRate: { type: Number, required: true, default: 0.18 },
    defaultDurationDays: { type: Number, default: 30 },
    defaultRepeatRate: { type: Number, default: 3 },
    minRepeatRate: { type: Number, default: 1 },
    maxRepeatRate: { type: Number, default: 20 },
    placementMultipliers: {
      // Malls
      phoenix_marketcity_pune: { type: Number, default: 1.8 },
      amanora_mall: { type: Number, default: 1.6 },
      seasons_mall: { type: Number, default: 1.5 },
      westend_mall: { type: Number, default: 1.4 },
      pavilion_mall: { type: Number, default: 1.4 },
      elpro_city_square: { type: Number, default: 1.3 },
      the_pavillion: { type: Number, default: 1.3 },
      // Hotels
      jw_marriott_pune: { type: Number, default: 2.2 },
      conrad_pune: { type: Number, default: 2.0 },
      ritz_carlton_pune: { type: Number, default: 2.5 },
      hyatt_regency_pune: { type: Number, default: 2.0 },
      sheraton_grand_pune: { type: Number, default: 1.9 },
      novotel_pune: { type: Number, default: 1.7 },
      blue_diamond_pune: { type: Number, default: 1.6 },
      // Other
      hospital: { type: Number, default: 1.2 },
      metro: { type: Number, default: 1.8 },
      airport: { type: Number, default: 2.0 },
      other: { type: Number, default: 1.0 },
    },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PricingConfig", pricingConfigSchema);
