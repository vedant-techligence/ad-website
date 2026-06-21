const mongoose = require("mongoose");

const analyticsSnapshotSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    engagements: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cvr: { type: Number, default: 0 },
    roas: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    avgSentiment: { type: Number, default: 0 },
    positiveMentions: { type: Number, default: 0 },
    neutralMentions: { type: Number, default: 0 },
    negativeMentions: { type: Number, default: 0 },
    robotInteractions: { type: Number, default: 0 },
    dwellTimeSec: { type: Number, default: 0 },
    healthScore: { type: Number, default: 0 },
  },
  { timestamps: true },
);

analyticsSnapshotSchema.index({ campaign: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("AnalyticsSnapshot", analyticsSnapshotSchema);
