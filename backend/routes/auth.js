const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "Account created successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, isProfileComplete: user.isProfileComplete },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({ token, isProfileComplete: user.isProfileComplete });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ONBOARDING
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
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
