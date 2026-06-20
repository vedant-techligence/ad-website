const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  listRobots,
  getRobot,
  createRobot,
  updateRobot,
  deleteRobot,
  assignCampaignToRobot,
  getRobotsByCity,
} = require("../controllers/robotController");

const router = express.Router();

router.get("/", authMiddleware, listRobots);
router.get("/by-city/grouped", authMiddleware, getRobotsByCity);
router.get("/:id", authMiddleware, getRobot);
router.post("/", authMiddleware, createRobot);
router.patch("/:id", authMiddleware, updateRobot);
router.delete("/:id", authMiddleware, deleteRobot);
router.post("/:id/assign-campaign", authMiddleware, assignCampaignToRobot);

module.exports = router;
