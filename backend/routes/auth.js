const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const signAccessToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role,
      isProfileComplete: user.isProfileComplete,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN },
  );

const signRefreshToken = (user) =>
  jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: "/api/auth",
  });
};

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }
    await new User({ name, email, password }).save();
    res.status(201).json({ message: "Account created successfully." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashToken(refreshToken);
    user.refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_COOKIE_MAX_AGE_MS,
    );
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.status(200).json({
      accessToken,
      role: user.role,
      isProfileComplete: user.isProfileComplete,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (
      !user ||
      !user.refreshTokenHash ||
      user.refreshTokenHash !== hashToken(token) ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt < new Date()
    ) {
      return res.status(401).json({ message: "Session expired." });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashToken(newRefreshToken);
    user.refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_COOKIE_MAX_AGE_MS,
    );
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    res.status(200).json({ accessToken: newAccessToken, role: user.role });
  } catch {
    return res.status(401).json({ message: "Session expired." });
  }
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        ignoreExpiration: true,
      });
      await User.findByIdAndUpdate(decoded.userId, {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      });
    } catch {}
  }

  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.status(200).json({ message: "Logged out." });
});

router.post("/onboarding", authMiddleware, async (req, res) => {
  const { businessName, industry, website } = req.body;
  try {
    await User.findByIdAndUpdate(req.user.userId, {
      businessName,
      industry,
      website,
      isProfileComplete: true,
    });
    res.status(200).json({ message: "Profile saved." });
  } catch (err) {
    console.error("Onboarding error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;