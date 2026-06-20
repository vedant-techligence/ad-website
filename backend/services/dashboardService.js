const Campaign = require("../models/Campaign");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const Notification = require("../models/Notification");
const Robot = require("../models/Robot");

const getRangeDays = (range) => {
  const parsed = Number(range);
  if ([7, 14, 30, 60, 90].includes(parsed)) {
    return parsed;
  }
  return 30;
};

const buildDashboardOverview = async (userId, range) => {
  const rangeDays = getRangeDays(range);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (rangeDays - 1));

  const [campaigns, snapshots, notifications, robots] = await Promise.all([
    Campaign.find({ owner: userId }).sort({ createdAt: -1 }),
    AnalyticsSnapshot.find({ owner: userId, date: { $gte: start } }).sort({ date: 1 }),
    Notification.find({ owner: userId }).sort({ createdAt: -1 }).limit(5),
    Robot.find({ owner: userId }).sort({ updatedAt: -1 }),
  ]);

  const totals = snapshots.reduce(
    (accumulator, snapshot) => {
      accumulator.impressions += snapshot.impressions;
      accumulator.engagements += snapshot.engagements;
      accumulator.clicks += snapshot.clicks;
      accumulator.conversions += snapshot.conversions;
      accumulator.spend += snapshot.spend;
      accumulator.revenue += snapshot.revenue;
      accumulator.sentiment += snapshot.avgSentiment;
      return accumulator;
    },
    {
      impressions: 0,
      engagements: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
      sentiment: 0,
    },
  );

  const timelineMap = new Map();
  snapshots.forEach((snapshot) => {
    const key = snapshot.date.toISOString().slice(0, 10);
    const current = timelineMap.get(key) || {
      date: key,
      impressions: 0,
      engagements: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      healthScore: 0,
      samples: 0,
    };
    current.impressions += snapshot.impressions;
    current.engagements += snapshot.engagements;
    current.clicks += snapshot.clicks;
    current.conversions += snapshot.conversions;
    current.spend += snapshot.spend;
    current.healthScore += snapshot.healthScore;
    current.samples += 1;
    timelineMap.set(key, current);
  });

  const performanceTrend = [...timelineMap.values()].map((entry) => ({
    ...entry,
    ctr: entry.impressions ? Number(((entry.clicks / entry.impressions) * 100).toFixed(2)) : 0,
    healthScore: Number((entry.healthScore / entry.samples).toFixed(1)),
  }));

  const activeCampaigns = campaigns.filter((campaign) =>
    ["active", "public", "scheduled"].includes(campaign.status),
  ).length;
  const averageHealth = campaigns.length
    ? Number(
        (
          campaigns.reduce((sum, campaign) => sum + (campaign.healthScore || 0), 0) / campaigns.length
        ).toFixed(1),
      )
    : 0;
  const averageSentiment = snapshots.length
    ? Number((totals.sentiment / snapshots.length).toFixed(1))
    : 0;

  const channelPerformance = Array.from(
    campaigns.reduce((map, campaign) => {
      (campaign.channels || []).forEach((channel) => {
        const current = map.get(channel) || { channel, campaigns: 0, budget: 0, healthScore: 0 };
        current.campaigns += 1;
        current.budget += campaign.budget?.spent || 0;
        current.healthScore += campaign.healthScore || 0;
        map.set(channel, current);
      });
      return map;
    }, new Map()).values(),
  ).map((entry) => ({
    ...entry,
    avgHealthScore: entry.campaigns ? Number((entry.healthScore / entry.campaigns).toFixed(1)) : 0,
  }));

  const sentimentBreakdown = campaigns.reduce(
    (accumulator, campaign) => {
      accumulator.positive += campaign.sentimentSummary?.positive || 0;
      accumulator.neutral += campaign.sentimentSummary?.neutral || 0;
      accumulator.negative += campaign.sentimentSummary?.negative || 0;
      return accumulator;
    },
    { positive: 0, neutral: 0, negative: 0 },
  );

  const topCampaigns = campaigns
    .slice()
    .sort((left, right) => (right.healthScore || 0) - (left.healthScore || 0))
    .slice(0, 5)
    .map((campaign) => ({
      id: campaign._id,
      title: campaign.title,
      brandName: campaign.brandName,
      status: campaign.status,
      healthScore: campaign.healthScore,
      sentimentScore: campaign.sentimentSummary?.score || 0,
      budgetSpent: campaign.budget?.spent || 0,
      placement: campaign.robotPlacement,
    }));

  return {
    overview: {
      totals: {
        campaigns: campaigns.length,
        activeCampaigns,
        impressions: totals.impressions,
        spend: Number(totals.spend.toFixed(2)),
        revenue: Number(totals.revenue.toFixed(2)),
        conversions: totals.conversions,
        ctr: totals.impressions ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
        engagementRate: totals.impressions
          ? Number(((totals.engagements / totals.impressions) * 100).toFixed(2))
          : 0,
        averageHealth,
        averageSentiment,
      },
      performanceTrend,
      topCampaigns,
      channelPerformance,
      sentimentBreakdown,
      notifications,
      robotSummary: {
        total: robots.length,
        active: robots.filter((robot) => robot.status === "active").length,
        cities: [...new Set(robots.map((robot) => robot.city).filter(Boolean))].length,
      },
    },
  };
};

const buildGeoAnalytics = async (userId) => {
  const robots = await Robot.find({ owner: userId }).populate("assignedCampaigns", "title brandName healthScore");

  const byCity = robots.reduce((map, robot) => {
    const current = map.get(robot.city) || {
      city: robot.city,
      robotCount: 0,
      impressions: 0,
      avgBattery: 0,
    };
    current.robotCount += 1;
    current.impressions += robot.todayImpressions || 0;
    current.avgBattery += robot.batteryLevel || 0;
    map.set(robot.city, current);
    return map;
  }, new Map());

  return {
    items: robots.map((robot) => ({
      id: robot._id,
      name: robot.name,
      robotCode: robot.robotCode,
      city: robot.city,
      status: robot.status,
      batteryLevel: robot.batteryLevel,
      networkQuality: robot.networkQuality,
      uptimePct: robot.uptimePct,
      todayImpressions: robot.todayImpressions,
      currentLocation: robot.currentLocation,
      assignedCampaigns: robot.assignedCampaigns,
      routeHistory: robot.routeHistory,
    })),
    byCity: [...byCity.values()].map((entry) => ({
      ...entry,
      avgBattery: entry.robotCount ? Number((entry.avgBattery / entry.robotCount).toFixed(1)) : 0,
    })),
  };
};

module.exports = {
  buildDashboardOverview,
  buildGeoAnalytics,
};
