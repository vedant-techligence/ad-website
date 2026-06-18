const { validationResult } = require("express-validator");
const { cleanupUploadedFiles } = require("../services/campaignVerification");

const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    next();
    return;
  }

  if (req.files?.length) {
    cleanupUploadedFiles(req.files);
  }

  next(
    Object.assign(new Error("Request validation failed."), {
      name: "ValidationError",
      errors: errors.array(),
    }),
  );
};

module.exports = { validate };
