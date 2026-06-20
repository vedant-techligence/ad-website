const { asyncHandler } = require("../utils/asyncHandler");
const { bootstrapDemoWorkspace } = require("../services/accountBootstrapService");
const {
  buildSentimentAnalytics,
  buildHealthScoreAnalytics,
} = require("../services/analyticsService");

const getSentimentAnalytics = asyncHandler(async (req, res) => {
  await bootstrapDemoWorkspace({ _id: req.user.userId });
  const analytics = await buildSentimentAnalytics(req.user.userId, req.query.range);
  res.status(200).json(analytics);
});

const getHealthScoreAnalytics = asyncHandler(async (req, res) => {
  await bootstrapDemoWorkspace({ _id: req.user.userId });
  const analytics = await buildHealthScoreAnalytics(req.user.userId);
  res.status(200).json(analytics);
});

module.exports = {
  getSentimentAnalytics,
  getHealthScoreAnalytics,
};
