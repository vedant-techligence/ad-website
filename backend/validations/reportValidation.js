const { body } = require("express-validator");

const reportCreateValidation = [
  body("name").trim().isLength({ min: 3 }).withMessage("Report name is required."),
  body("type")
    .isIn(["performance", "sentiment", "geo", "comparison", "executive"])
    .withMessage("Report type is invalid."),
  body("format")
    .optional({ values: "falsy" })
    .isIn(["json", "pdf", "csv"])
    .withMessage("Format must be json, pdf, or csv."),
];

module.exports = { reportCreateValidation };
