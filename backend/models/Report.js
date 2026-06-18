const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["performance", "sentiment", "geo", "comparison", "executive"],
      default: "performance",
    },
    status: {
      type: String,
      enum: ["ready", "queued", "failed"],
      default: "ready",
    },
    format: {
      type: String,
      enum: ["json", "pdf", "csv"],
      default: "json",
    },
    dateRange: {
      from: { type: Date, default: null },
      to: { type: Date, default: null },
    },
    summary: { type: String, default: "" },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    sections: { type: [mongoose.Schema.Types.Mixed], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Report", reportSchema);
