const express = require("express");
const router = express.Router();
const {
  ingestVisionData,
  ingestInteractionData,
  getAdDecision,
  getDashboardData,
} = require("../controllers/robotAnalyticsController");

// Robot endpoints
router.post("/vision", ingestVisionData);
router.post("/interaction", ingestInteractionData);
router.get("/ad-decision", getAdDecision);

// Dashboard endpoints
router.get("/dashboard", getDashboardData);

module.exports = router;
