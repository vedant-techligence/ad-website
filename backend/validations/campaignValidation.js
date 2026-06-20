const { body } = require("express-validator");

const campaignCreateValidation = [
  body("title").trim().isLength({ min: 3 }).withMessage("Campaign title is required."),
  body("brandName").trim().isLength({ min: 2 }).withMessage("Brand name is required."),
  body("robotPlacement").trim().isLength({ min: 3 }).withMessage("Robot placement is required."),
  body("description").trim().isLength({ min: 10 }).withMessage("Description is required."),
  body("startDate").notEmpty().withMessage("Start date is required."),
  body("endDate").notEmpty().withMessage("End date is required."),
  body("repeatRate").isInt({ min: 1, max: 20 }).withMessage("Repeat rate must be between 1 and 20."),
  body("dailyBudgetCap").isFloat({ min: 0 }).withMessage("Daily budget cap must be zero or greater."),
  body("destinationUrl")
    .optional({ values: "falsy" })
    .trim()
    .isURL({ require_protocol: true })
    .withMessage("Destination URL must be valid."),
];

const campaignUpdateValidation = [
  body("title").optional({ values: "falsy" }).trim().isLength({ min: 3 }).withMessage("Campaign title is required."),
  body("brandName").optional({ values: "falsy" }).trim().isLength({ min: 2 }).withMessage("Brand name is required."),
  body("robotPlacement")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3 })
    .withMessage("Robot placement is required."),
  body("description").optional({ values: "falsy" }).trim().isLength({ min: 10 }).withMessage("Description is required."),
  body("repeatRate").optional({ values: "falsy" }).isInt({ min: 1, max: 20 }).withMessage("Repeat rate must be between 1 and 20."),
  body("dailyBudgetCap")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Daily budget cap must be zero or greater."),
  body("destinationUrl")
    .optional({ values: "falsy" })
    .trim()
    .isURL({ require_protocol: true })
    .withMessage("Destination URL must be valid."),
];

const importDriveValidation = [
  body("driveUrl").trim().isURL({ require_protocol: true }).withMessage("A valid Google Drive URL is required."),
];

module.exports = {
  campaignCreateValidation,
  campaignUpdateValidation,
  importDriveValidation,
};
