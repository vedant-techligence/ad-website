const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { getOverview, getGeoAnalytics } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/overview", authMiddleware, getOverview);
router.get("/geo", authMiddleware, getGeoAnalytics);

module.exports = router;
