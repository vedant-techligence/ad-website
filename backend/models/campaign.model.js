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
      enum: ["pending", "approved", "rejected"], // "pending" added —
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

    // ---- Ad content (what the ad says / where it physically shows) ----
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
      validate: {
        validator: function (assets) {
          return assets.some((a) => a.kind === "video");
        },
        message: "At least one video file is required per campaign.",
      },
    },

    // ---- Targeting  ----
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

    // ---- Schedule & frequency (how long / how often) ----
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    repeatRate: {
      type: Number, // max times a single user sees this ad per day
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

    // ---- Pricing  ----
    estimatedCost: {
      type: Number,
      default: 0,
    },

    // ---- Verification ----
    verification: {
      type: verificationSchema,
      default: () => ({}),
    },

    // ---- Lifecycle — expanded to include payment + verification states ----
    status: {
      type: String,
      enum: [
        "draft", // created, not yet submitted for payment
        "pending_payment", // payment initiated, awaiting confirmation
        "paid_pending_verification", // paid, waiting on content moderation
        "public", // verified + live
        "rejected", // failed verification
        "completed", // ran its full duration
        "cancelled", // advertiser cancelled
      ],
      default: "draft",
      index: true,
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

campaignSchema.index({ owner: 1, status: 1 });

// endDate must be after startDate
campaignSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    return next(new Error("endDate must be after startDate"));
  }
  next();
});

module.exports = mongoose.model("Campaign", campaignSchema);
