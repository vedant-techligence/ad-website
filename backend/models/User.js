const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    businessName: { type: String, default: "" },
    industry: { type: String, default: "" },
    website: {
      type: String,
      default: "",
      match: [/^(https?:\/\/.+)?$/, "Website must start with http:// or https://"],
    },
    phone: {
      type: String,
      default: "",
      match: [/^([0-9]{10,15})?$/, "Phone must be 10-15 digits"],
    },
    companySize: { type: String, enum: ["", "1-10", "11-50", "51-200", "201-500", "500+"], default: "" },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 300 },
    linkedIn: { type: String, default: "" },
    twitter: { type: String, default: "" },
    timezone: { type: String, default: "" },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: null,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: { type: String, default: "" },
    bannedAt: { type: Date, default: null },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    preferences: {
      reportFrequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "weekly",
      },
      healthAlertThreshold: {
        type: Number,
        min: 0,
        max: 100,
        default: 65,
      },
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
