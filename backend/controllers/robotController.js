const Robot = require("../models/Robot");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { getPagination } = require("../utils/pagination");

const listRobots = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filters = { owner: req.user.userId };

  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.city) {
    filters.city = req.query.city;
  }

  const [items, total] = await Promise.all([
    Robot.find(filters)
      .populate("assignedCampaigns", "title brandName status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Robot.countDocuments(filters),
  ]);

  res.status(200).json({
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const getRobot = asyncHandler(async (req, res) => {
  const robot = await Robot.findOne({
    _id: req.params.id,
    owner: req.user.userId,
  }).populate("assignedCampaigns", "title brandName status");

  if (!robot) {
    throw new ApiError(404, "Robot not found.");
  }

  res.status(200).json({ item: robot });
});

const createRobot = asyncHandler(async (req, res) => {
  const { name, robotCode, model, city, batteryLevel, networkQuality, lat, lng, address } = req.body;

  if (!name || !robotCode) {
    throw new ApiError(400, "Name and robotCode are required.");
  }

  const robot = await Robot.create({
    owner: req.user.userId,
    name,
    robotCode,
    model: model || "TL-RoboDisplay X2",
    city: city || "",
    batteryLevel: batteryLevel || 100,
    networkQuality: networkQuality || 100,
    currentLocation: {
      lat: lat || 28.6139,
      lng: lng || 77.209,
      address: address || "",
      lastSeen: new Date(),
    },
  });

  res.status(201).json({ item: robot });
});

const updateRobot = asyncHandler(async (req, res) => {
  const robot = await Robot.findOne({
    _id: req.params.id,
    owner: req.user.userId,
  });

  if (!robot) {
    throw new ApiError(404, "Robot not found.");
  }

  const updates = {
    name: req.body.name || robot.name,
    status: req.body.status || robot.status,
    city: req.body.city !== undefined ? req.body.city : robot.city,
    batteryLevel: req.body.batteryLevel !== undefined ? req.body.batteryLevel : robot.batteryLevel,
    networkQuality: req.body.networkQuality !== undefined ? req.body.networkQuality : robot.networkQuality,
    uptimePct: req.body.uptimePct !== undefined ? req.body.uptimePct : robot.uptimePct,
    todayImpressions: req.body.todayImpressions !== undefined ? req.body.todayImpressions : robot.todayImpressions,
  };

  if (req.body.lat !== undefined && req.body.lng !== undefined) {
    updates.currentLocation = {
      lat: req.body.lat,
      lng: req.body.lng,
      address: req.body.address || robot.currentLocation.address,
      lastSeen: new Date(),
    };

    if (!robot.routeHistory) robot.routeHistory = [];
    robot.routeHistory.push({
      lat: req.body.lat,
      lng: req.body.lng,
      address: req.body.address || robot.currentLocation.address,
      timestamp: new Date(),
    });
    if (robot.routeHistory.length > 50) {
      robot.routeHistory = robot.routeHistory.slice(-50);
    }
  }

  Object.assign(robot, updates);
  await robot.save();
  await robot.populate("assignedCampaigns", "title brandName status");

  res.status(200).json({ item: robot });
});

const deleteRobot = asyncHandler(async (req, res) => {
  const robot = await Robot.findOneAndDelete({
    _id: req.params.id,
    owner: req.user.userId,
  });

  if (!robot) {
    throw new ApiError(404, "Robot not found.");
  }

  res.status(200).json({ message: "Robot deleted successfully." });
});

const assignCampaignToRobot = asyncHandler(async (req, res) => {
  const { campaignId } = req.body;

  if (!campaignId) {
    throw new ApiError(400, "campaignId is required.");
  }

  const robot = await Robot.findOne({
    _id: req.params.id,
    owner: req.user.userId,
  });

  if (!robot) {
    throw new ApiError(404, "Robot not found.");
  }

  if (!robot.assignedCampaigns.includes(campaignId)) {
    robot.assignedCampaigns.push(campaignId);
    await robot.save();
  }

  await robot.populate("assignedCampaigns", "title brandName status");
  res.status(200).json({ item: robot });
});

const getRobotsByCity = asyncHandler(async (req, res) => {
  const robots = await Robot.find({ owner: req.user.userId })
    .select("name robotCode city status batteryLevel currentLocation")
    .sort({ city: 1 });

  const grouped = {};
  robots.forEach((robot) => {
    if (!grouped[robot.city]) {
      grouped[robot.city] = [];
    }
    grouped[robot.city].push(robot);
  });

  res.status(200).json({ items: grouped });
});

module.exports = {
  listRobots,
  getRobot,
  createRobot,
  updateRobot,
  deleteRobot,
  assignCampaignToRobot,
  getRobotsByCity,
};
