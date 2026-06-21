const { asyncHandler } = require("../utils/asyncHandler");
const { buildDashboardOverview, buildGeoAnalytics } = require("../services/dashboardService");
const { bootstrapDemoWorkspace } = require("../services/accountBootstrapService");

const getOverview = asyncHandler(async (req, res) => {
  await bootstrapDemoWorkspace({ _id: req.user.userId });
  const overview = await buildDashboardOverview(req.user.userId, req.query.range);
  res.status(200).json(overview);
});

const getGeoAnalytics = asyncHandler(async (req, res) => {
  await bootstrapDemoWorkspace({ _id: req.user.userId });
  const geoAnalytics = await buildGeoAnalytics(req.user.userId);
  res.status(200).json(geoAnalytics);
});

module.exports = {
  getOverview,
  getGeoAnalytics,
};
