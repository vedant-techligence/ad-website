const mongoose = require("mongoose");

const routeHistorySchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    address: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const robotSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    robotCode: { type: String, required: true },
    serialNumber: { type: String, unique: true, sparse: true, trim: true },
    model: { type: String, default: "TL-RoboDisplay X2" },
    status: {
      type: String,
      enum: ["active", "charging", "maintenance", "offline", "online"],
      default: "offline",
      index: true,
    },
    city: { type: String, default: "" },
    assignedCampaigns: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
    ],
    batteryLevel: { type: Number, default: 100 },
    networkQuality: { type: Number, default: 100 },
    uptimePct: { type: Number, default: 99.5 },
    todayImpressions: { type: Number, default: 0 },
    currentLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      address: { type: String, default: "" },
      lastSeen: { type: Date, default: Date.now },
    },
    routeHistory: {
      type: [routeHistorySchema],
      default: [],
    },
    lastSeenAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

robotSchema.index({ status: 1 });
robotSchema.index({ city: 1 });

module.exports = mongoose.model("Robot", robotSchema);