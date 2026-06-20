const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { bootstrapDemoWorkspace } = require("../services/accountBootstrapService");

const signToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      email: user.email,
      isProfileComplete: user.isProfileComplete,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  businessName: user.businessName || "",
  industry: user.industry || "",
  website: user.website || "",
  role: user.role,
  isProfileComplete: user.isProfileComplete,
  preferences: user.preferences,
  createdAt: user.createdAt,
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(400, "Email already registered.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  res.status(201).json({
    message: "Account created successfully.",
    token: signToken(user),
    user: serializeUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(400, "Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(400, "Invalid email or password.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  if (user.isProfileComplete) {
    await bootstrapDemoWorkspace(user);
  }

  res.status(200).json({
    token: signToken(user),
    user: serializeUser(user),
  });
});

const completeOnboarding = asyncHandler(async (req, res) => {
  const { businessName, industry, website } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    {
      businessName,
      industry,
      website,
      isProfileComplete: true,
    },
    { new: true },
  );

  await bootstrapDemoWorkspace(user);

  res.status(200).json({
    message: "Profile saved.",
    token: signToken(user),
    user: serializeUser(user),
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  res.status(200).json({ user: serializeUser(user) });
});

module.exports = {
  register,
  login,
  completeOnboarding,
  getProfile,
};
