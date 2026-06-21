const { body } = require("express-validator");

const registerValidation = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  body("email").trim().isEmail().withMessage("Provide a valid email address."),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("Provide a valid email address."),
  body("password").notEmpty().withMessage("Password is required."),
];

const onboardingValidation = [
  body("businessName").trim().isLength({ min: 2 }).withMessage("Business name is required."),
  body("industry").trim().isLength({ min: 2 }).withMessage("Industry is required."),
  body("website")
    .optional({ values: "falsy" })
    .trim()
    .isURL({ require_protocol: true })
    .withMessage("Website must be a valid URL with protocol."),
];

module.exports = {
  registerValidation,
  loginValidation,
  onboardingValidation,
};
