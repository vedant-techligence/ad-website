const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["campaign", "report", "health", "system", "geo"],
      default: "system",
    },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "critical"],
      default: "info",
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    entityType: { type: String, default: "" },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    ctaLabel: { type: String, default: "" },
    ctaUrl: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
