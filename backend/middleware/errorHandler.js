const { ApiError } = require("../utils/ApiError");

const errorHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error.name === "ValidationError") {
    res.status(400).json({ message: "Validation failed.", details: error.errors });
    return;
  }

  console.error(error);
  res.status(500).json({
    message: "Internal server error.",
  });
};

module.exports = { errorHandler };
