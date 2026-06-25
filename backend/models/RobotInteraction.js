const mongoose = require("mongoose");

const robotInteractionSchema = new mongoose.Schema(
  {
    robotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Robot",
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
      default: Date.now,
    },
    durationSeconds: { type: Number, default: 0 },
    successRate: { type: Number, default: 100 }, // 0 to 100 percentage
    languageUsed: { type: String, default: "English" },
    questions: [
      {
        text: { type: String },
        category: {
          type: String,
          enum: [
            "Product Information",
            "Pricing",
            "Availability",
            "Booking",
            "Warranty",
            "Admissions",
            "Discounts",
            "Other",
          ],
          default: "Other",
        },
      },
    ],
    leadGenerated: { type: Boolean, default: false },
    outcome: {
      type: String,
      enum: ["Brochure Download", "Signup", "Appointment Booked", "Purchase", "None"],
      default: "None",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RobotInteraction", robotInteractionSchema);
