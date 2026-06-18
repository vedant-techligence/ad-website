const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    businessName: { type: String },
    industry: { type: String },
    website: { type: String },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "admin",
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    preferences: {
      reportFrequency: {
        type: String,
        default: "weekly",
      },
      healthAlertThreshold: {
        type: Number,
        default: 65,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
