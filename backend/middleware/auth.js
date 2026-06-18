const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    next(new ApiError(401, "Unauthorized"));
    return;
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new ApiError(401, "Invalid token"));
  }
};

module.exports = { authMiddleware };
