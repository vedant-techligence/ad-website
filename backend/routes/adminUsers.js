const express = require("express");
const User = require("../models/User");
const Campaign = require("../models/Campaign.model");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/all", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};
    if (status === "banned") query.isBanned = true;
    if (status === "active") query.isBanned = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch {
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

router.get("/:id", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch user." });
  }
});

router.get(
  "/:id/campaigns",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const campaigns = await Campaign.find({ owner: req.params.id }).sort({
        createdAt: -1,
      });
      res.status(200).json(campaigns);
    } catch {
      res.status(500).json({ message: "Failed to fetch campaign history." });
    }
  },
);

router.patch(
  "/:id/ban",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: "You cannot ban yourself." });
    }
    try {
      const { reason } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: true, banReason: reason || "", bannedAt: new Date() },
        { new: true },
      );
      if (!user) return res.status(404).json({ message: "User not found." });
      res.status(200).json(user);
    } catch {
      res.status(500).json({ message: "Failed to ban user." });
    }
  },
);

router.patch(
  "/:id/unban",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: false, banReason: "", bannedAt: null },
        { new: true },
      );
      if (!user) return res.status(404).json({ message: "User not found." });
      res.status(200).json(user);
    } catch {
      res.status(500).json({ message: "Failed to unban user." });
    }
  },
);

module.exports = router;
