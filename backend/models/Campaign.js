const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    storedName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    kind: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    relativePath: {
      type: String,
      required: true,
    },
    publicUrl: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["approved", "rejected"],
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    checkedAt: {
      type: Date,
      required: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    flaggedTerms: {
      type: [String],
      default: [],
    },
    issues: {
      type: [String],
      default: [],
    },
    checksSummary: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const campaignSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    robotPlacement: {
      type: String,
      required: true,
      trim: true,
    },
    destinationUrl: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    callToAction: {
      type: String,
      trim: true,
      default: "",
    },
    spokenWords: {
      type: String,
      trim: true,
      default: "",
    },
    slideText: {
      type: String,
      trim: true,
      default: "",
    },
    mediaAssets: {
      type: [mediaAssetSchema],
      default: [],
    },
    verification: {
      type: verificationSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ["rejected", "public"],
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Campaign", campaignSchema);
