const express = require("express");
const { register, login, completeOnboarding, getProfile, updateProfile } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  registerValidation,
  loginValidation,
  onboardingValidation,
} = require("../validations/authValidation");

const router = express.Router();

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/onboarding", authMiddleware, onboardingValidation, validate, completeOnboarding);
router.get("/me", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
