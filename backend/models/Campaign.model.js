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
    source: {
      type: String,
      enum: ["upload", "google_drive", "youtube"],
      default: "upload",
    },
    sourceUrl: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    checkedAt: {
      type: Date,
      default: null,
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
      default: "",
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
    videoDuration: {
      type: Number,
      default: 30,
    },
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
      realTimeCrowdTargeting: {
        type: Boolean,
        default: false,
      },
      audienceSegments: { type: [String], default: [] },
      regions: { type: [String], default: [] },
      devices: { type: [String], default: [] },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    repeatRate: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      default: 3,
    },
    dailyBudgetCap: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    verification: {
      type: verificationSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: [
        "draft",
        "pending_payment",
        "paid_pending_verification",
        "public",
        "rejected",
        "completed",
        "cancelled",
        "scheduled",
        "active",
        "paused",
      ],
      default: "draft",
      index: true,
    },
    publicationStatus: {
      type: String,
      enum: ["public", "blocked", "scheduled"],
      default: "blocked",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    budget: {
      allocated: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
    },
    schedule: {
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
    channels: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    location: {
      city: { type: String, default: "" },
      venue: { type: String, default: "" },
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.209 },
    },
    performanceGoals: {
      impressions: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
    },
    sentimentSummary: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
    },
    healthScore: {
      type: Number,
      default: 0,
    },
    generatedInsights: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

campaignSchema.index({ owner: 1, status: 1 });

campaignSchema.pre("validate", function validateDates() {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate("endDate", "endDate must be after startDate");
    return;
  }

  if (!this.schedule?.startDate && this.startDate) {
    this.schedule = {
      ...this.schedule,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }
});

module.exports = mongoose.model("Campaign", campaignSchema);
