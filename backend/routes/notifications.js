const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  listNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authMiddleware, listNotifications);
router.post("/", authMiddleware, createNotification);
router.patch("/read-all", authMiddleware, markAllAsRead);
router.patch("/:id/read", authMiddleware, markAsRead);

module.exports = router;
