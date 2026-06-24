const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    advertiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ---- Razorpay identifiers ----
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String, // only set once payment actually completes
      default: null,
    },
    razorpaySignature: {
      type: String, // stored for audit trail, used to verify the webhook
      default: null,
    },

    // ---- Amount breakdown  ----
    amount: {
      type: Number, // final amount actually charged, in smallest currency unit (paise for INR)
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    breakdown: {
      baseRate: { type: Number, default: 0 },
      durationDays: { type: Number, default: 0 },
      repeatRateMultiplier: { type: Number, default: 1 },
      platformFee: { type: Number, default: 0 },
      gstAmount: { type: Number, default: 0 },
    },

    // ---- Status lifecycle ----
    status: {
      type: String,
      enum: [
        "created", // Razorpay order created, awaiting payment
        "paid", // payment confirmed via webhook
        "failed", // payment attempt failed
        "refunded", // fully refunded
        "partially_refunded",
      ],
      default: "created",
      index: true,
    },

    // ---- Refund tracking ----
    refund: {
      razorpayRefundId: { type: String, default: null },
      amount: { type: Number, default: 0 },
      reason: { type: String, default: "" },
      processedAt: { type: Date, default: null },
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // the admin who triggered the refund
        default: null,
      },
    },

    // ---- Invoice ----
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true, // only generated once payment succeeds
    },
  },
  { timestamps: true },
);

paymentSchema.index({ advertiser: 1, status: 1 });
paymentSchema.index({ createdAt: -1 }); // admin transaction list sorts by most recent

module.exports = mongoose.model("Payment", paymentSchema);
