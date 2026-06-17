const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    kind: { type: String, enum: ["image", "video"], required: true },
    relativePath: { type: String, required: true },
    publicUrl: { type: String, required: true },
  },
  { _id: false },
);

const verificationSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["approved", "rejected"] },
    riskLevel: { type: String, enum: ["low", "medium", "high"] },
    checkedAt: { type: Date },
    approvedAt: { type: Date, default: null },
    flaggedTerms: { type: [String], default: [] },
    issues: { type: [String], default: [] },
    checksSummary: { type: String },
    reviewedAt: { type: Date },
    decision: { type: String, enum: ["approved", "rejected"] },
    reason: { type: String },
  },
  { _id: false },
);

const campaignSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    advertiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },

    brandName: { type: String, trim: true },
    robotPlacement: { type: String, trim: true },
    destinationUrl: { type: String, trim: true, default: "" },
    callToAction: { type: String, trim: true, default: "" },
    spokenWords: { type: String, trim: true, default: "" },
    slideText: { type: String, trim: true, default: "" },
    mediaAssets: { type: [mediaAssetSchema], default: [] },
    isPublic: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },

    videoUrl: { type: String },
    videoPublicId: { type: String },
    thumbnailUrl: { type: String },
    targetUrl: { type: String, trim: true },
    targeting: {
      locations: [{ type: String }],
      ageRange: {
        min: { type: Number, default: 18 },
        max: { type: Number, default: 65 },
      },
      interests: [{ type: String }],
      gender: {
        type: String,
        enum: ["all", "male", "female", "other"],
        default: "all",
      },
    },
    startDate: { type: Date },
    endDate: { type: Date },
    repeatRate: { type: Number, min: 1, max: 20, default: 3 },
    dailyBudgetCap: { type: Number, min: 0 },
    estimatedCost: { type: Number, default: 0 },

    verification: { type: verificationSchema },
    status: {
      type: String,
      enum: [
        "draft",
        "pending_payment",
        "paid_pending_verification",
        "active",
        "rejected",
        "public",
        "completed",
        "cancelled",
      ],
      default: "draft",
      index: true,
    },
  },
  { timestamps: true },
);

campaignSchema.index({ advertiser: 1, status: 1 });

module.exports = mongoose.model("Campaign", campaignSchema);