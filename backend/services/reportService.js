const Campaign = require("../models/Campaign");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const Report = require("../models/Report");
const Robot = require("../models/Robot");

const generateReport = async (userId, payload) => {
  const [campaigns, snapshots, robots] = await Promise.all([
    Campaign.find({ owner: userId }).sort({ createdAt: -1 }),
    AnalyticsSnapshot.find({ owner: userId }).sort({ date: -1 }).limit(120),
    Robot.find({ owner: userId }),
  ]);

  const totals = snapshots.reduce(
    (accumulator, snapshot) => {
      accumulator.impressions += snapshot.impressions;
      accumulator.conversions += snapshot.conversions;
      accumulator.spend += snapshot.spend;
      accumulator.revenue += snapshot.revenue;
      return accumulator;
    },
    { impressions: 0, conversions: 0, spend: 0, revenue: 0 },
  );

  const averageHealth = campaigns.length
    ? Number(
        (
          campaigns.reduce((sum, campaign) => sum + (campaign.healthScore || 0), 0) / campaigns.length
        ).toFixed(1),
      )
    : 0;

  return Report.create({
    owner: userId,
    name: payload.name,
    type: payload.type,
    format: payload.format || "json",
    status: "ready",
    dateRange: {
      from: payload.from || null,
      to: payload.to || null,
    },
    filters: payload.filters || {},
    summary:
      payload.summary ||
      `Generated ${payload.type} report covering ${campaigns.length} campaigns and ${robots.length} active robots.`,
    metrics: {
      campaigns: campaigns.length,
      robots: robots.length,
      impressions: totals.impressions,
      conversions: totals.conversions,
      spend: Number(totals.spend.toFixed(2)),
      revenue: Number(totals.revenue.toFixed(2)),
      averageHealth,
    },
    sections: [
      {
        title: "Performance highlights",
        points: campaigns.slice(0, 3).map(
          (campaign) => `${campaign.title}: health ${campaign.healthScore}, sentiment ${campaign.sentimentSummary?.score || 0}.`,
        ),
      },
      {
        title: "Operational notes",
        points: [
          `${robots.filter((robot) => robot.status === "active").length} robots are currently active.`,
          "Advanced audio/video moderation endpoints are mocked for future AWS/OpenAI integrations.",
        ],
      },
    ],
  });
};

module.exports = { generateReport };
