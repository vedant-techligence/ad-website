const { body } = require("express-validator");

const campaignCreateValidation = [
  body("title").trim().isLength({ min: 3 }).withMessage("Campaign title is required."),
  body("brandName").trim().isLength({ min: 2 }).withMessage("Brand name is required."),
  body("robotPlacement").trim().isLength({ min: 3 }).withMessage("Robot placement is required."),
  body("description").trim().isLength({ min: 3 }).withMessage("Description is required."),
  body("destinationUrl")
    .optional({ values: "falsy" })
    .trim()
    .custom((value) => {
      if (!value || value === "") return true;
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(value)) {
        throw new Error("Destination URL must start with http:// or https://");
      }
      return true;
    })
    .withMessage("Destination URL must be valid."),
];

const campaignUpdateValidation = [
  body("title").optional({ values: "falsy" }).trim().isLength({ min: 3 }).withMessage("Campaign title is required."),
  body("brandName").optional({ values: "falsy" }).trim().isLength({ min: 2 }).withMessage("Brand name is required."),
  body("robotPlacement").optional({ values: "falsy" }).trim().isLength({ min: 3 }).withMessage("Robot placement is required."),
  body("description").optional({ values: "falsy" }).trim().isLength({ min: 10 }).withMessage("Description is required."),
  body("destinationUrl")
    .optional({ values: "falsy" })
    .trim()
    .custom((value) => {
      if (!value || value === "") return true;
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(value)) {
        throw new Error("Destination URL must start with http:// or https://");
      }
      return true;
    })
    .withMessage("Destination URL must be valid."),
];

module.exports = {
  campaignCreateValidation,
  campaignUpdateValidation,
};
