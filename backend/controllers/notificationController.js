const Notification = require("../models/Notification");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { getPagination } = require("../utils/pagination");

const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [items, total, unread] = await Promise.all([
    Notification.find({ owner: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ owner: req.user.userId }),
    Notification.countDocuments({ owner: req.user.userId, isRead: false }),
  ]);

  res.status(200).json({
    items,
    stats: { unread, total },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.userId },
    { isRead: true, readAt: new Date() },
    { new: true },
  );

  if (!item) {
    throw new ApiError(404, "Notification not found.");
  }

  res.status(200).json({ item });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { owner: req.user.userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );

  res.status(200).json({ message: "All notifications marked as read." });
});

const createNotification = asyncHandler(async (req, res) => {
  const { title, message, type, severity, ctaLabel, ctaUrl } = req.body;

  if (!title || !message) {
    throw new ApiError(400, "Title and message are required.");
  }

  const item = await Notification.create({
    owner: req.user.userId,
    title,
    message,
    type: type || "system",
    severity: severity || "info",
    ctaLabel: ctaLabel || "",
    ctaUrl: ctaUrl || "",
  });

  res.status(201).json({ item });
});

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
};
