const mongoose = require("mongoose");

const robotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String, // hardware identifier
      required: true,
      unique: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["online", "offline", "maintenance"],
      default: "offline",
      
    },
    lastSeenAt: {
      type: Date, // last heartbeat/ping from the robot — 
      default: null,
    },

    location: {
      label: { type: String, trim: true }, //
      city: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },

    // currently playing campaign(s) — a robot could rotate between several
    assignedCampaigns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
      },
    ],

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

robotSchema.index({ status: 1 });
robotSchema.index({ "location.city": 1 });

module.exports = mongoose.model("Robot", robotSchema);
