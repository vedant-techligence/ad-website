const express = require("express");
const { register, login, completeOnboarding, getProfile } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  registerValidation,
  loginValidation,
  onboardingValidation,
} = require("../validations/authValidation");

const router = express.Router();

<<<<<<< Updated upstream
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
    console.error("reg ERROR:", err);

    res.status(500).json({ message: "Server error." });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login route hit, body:", req.body);


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
    console.error("LOGIN ERROR:", err);

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
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});
=======
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/onboarding", authMiddleware, onboardingValidation, validate, completeOnboarding);
router.get("/me", authMiddleware, getProfile);
>>>>>>> Stashed changes

module.exports = router;
