const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  getSentimentAnalytics,
  getHealthScoreAnalytics,
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/sentiment", authMiddleware, getSentimentAnalytics);
router.get("/health-scores", authMiddleware, getHealthScoreAnalytics);

module.exports = router;
