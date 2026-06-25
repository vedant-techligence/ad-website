const mongoose = require("mongoose");

const robotAnalyticsSnapshotSchema = new mongoose.Schema(
  {
    robotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Robot",
      required: true,
      index: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: false, // Optional, depending on if an ad is playing
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
      default: Date.now,
    },
    crowdSize: { type: Number, default: 0 },
    density: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    demographics: {
      ageGroups: {
        children: { type: Number, default: 0 },
        youngAdults: { type: Number, default: 0 },
        adults: { type: Number, default: 0 },
        seniors: { type: Number, default: 0 },
      },
      gender: {
        male: { type: Number, default: 0 },
        female: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
    },
    funnel: {
      footfall: { type: Number, default: 0 }, // People passing by
      peopleLooking: { type: Number, default: 0 },
      qualifiedImpressions: { type: Number, default: 0 }, // Watched min duration
      approaching: { type: Number, default: 0 },
      startingConversations: { type: Number, default: 0 },
      questionsAsked: { type: Number, default: 0 },
      qualifiedLeads: { type: Number, default: 0 },
      brochureDownloads: { type: Number, default: 0 },
      signups: { type: Number, default: 0 },
      appointmentsBooked: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
    },
    robotHealth: {
      batteryLevel: { type: Number, default: 100 },
      connectivityStatus: { type: String, enum: ["Online", "Offline", "Unstable"], default: "Online" },
      gpsLocation: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    currentAdDisplayed: { type: String, default: null }, // ID or title of current ad
  },
  { timestamps: true }
);

module.exports = mongoose.model("RobotAnalyticsSnapshot", robotAnalyticsSnapshotSchema);
