const Report = require("../models/Report");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { getPagination } = require("../utils/pagination");
const { generateReport } = require("../services/reportService");

const listReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [items, total] = await Promise.all([
    Report.find({ owner: req.user.userId }).sort({ generatedAt: -1 }).skip(skip).limit(limit),
    Report.countDocuments({ owner: req.user.userId }),
  ]);

  res.status(200).json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const createReport = asyncHandler(async (req, res) => {
  const item = await generateReport(req.user.userId, req.body);
  res.status(201).json({ item });
});

const getReport = asyncHandler(async (req, res) => {
  const item = await Report.findOne({ _id: req.params.id, owner: req.user.userId });
  if (!item) {
    throw new ApiError(404, "Report not found.");
  }

  res.status(200).json({ item });
});

const deleteReport = asyncHandler(async (req, res) => {
  const item = await Report.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
  if (!item) {
    throw new ApiError(404, "Report not found.");
  }

  res.status(200).json({ message: "Report deleted successfully." });
});

module.exports = {
  listReports,
  createReport,
  getReport,
  deleteReport,
};
