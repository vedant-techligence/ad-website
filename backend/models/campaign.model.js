import mongoose, { Schema } from "mongoose";

const campaignSchema = new Schema(
  {
    advertiser: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // ---- Creative ----
    videoUrl: {
      type: String, // Cloudinary secure_url
      required: true,
    },
    videoPublicId: {
      type: String, // Cloudinary public_id, 
      required: true,
    },
    thumbnailUrl: {
      type: String, 
    },
    targetUrl: {
      type: String, // where the ad click should land
      required: true,
      trim: true,
    },

    // ---- Targeting ----
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

    // ---- Schedule & frequency ----
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

    // ---- Lifecycle ----
    status: {
      type: String,
      enum: [
        "draft", // created, not yet submitted for payment
        "pending_payment", // payment initiated, awaiting confirmation
        "paid_pending_verification", // paid, waiting on content moderation team
        "active", // verified + live to public
        "rejected", // failed verification
        "completed", // ran its full duration
        "cancelled", // advertiser cancelled
      ],
      default: "draft",
      index: true,
    },

    // filled in by the verification team 
    verification: {
      reviewedAt: { type: Date },
      decision: { type: String, enum: ["approved", "rejected"] },
      reason: { type: String },
    },
  },
  { timestamps: true },
);



campaignSchema.index({ advertiser: 1, status: 1 });

// campaignSchema.pre("validate", function (next) {
//   if (this.startDate && this.endDate && this.endDate <= this.startDate) {
//     return next(new Error("endDate must be after startDate"));
//   }
//   next();
// });

export const Campaign = mongoose.model("Campaign", campaignSchema);
