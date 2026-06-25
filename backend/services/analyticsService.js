const Campaign = require("../models/Campaign");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");

const getRangeDays = (range) => {
  const parsed = Number(range);
  if ([7, 14, 30, 60, 90].includes(parsed)) {
    return parsed;
  }
  return 30;
};

const buildSentimentAnalytics = async (userId, role, range) => {
  const rangeDays = getRangeDays(range);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (rangeDays - 1));

  const ownerFilter = role === "admin" ? {} : { owner: userId };

  const [campaigns, snapshots] = await Promise.all([
    Campaign.find(ownerFilter).select("title brandName sentimentSummary healthScore status"),
    AnalyticsSnapshot.find({ ...ownerFilter, date: { $gte: start } }).sort({ date: 1 }),
  ]);

  const breakdown = campaigns.reduce(
    (accumulator, campaign) => {
      accumulator.positive += campaign.sentimentSummary?.positive || 0;
      accumulator.neutral += campaign.sentimentSummary?.neutral || 0;
      accumulator.negative += campaign.sentimentSummary?.negative || 0;
      return accumulator;
    },
    { positive: 0, neutral: 0, negative: 0 },
  );

  const timeline = snapshots.reduce((map, snapshot) => {
    const key = snapshot.date.toISOString().slice(0, 10);
    const current = map.get(key) || { date: key, avgSentiment: 0, samples: 0 };
    current.avgSentiment += snapshot.avgSentiment;
    current.samples += 1;
    map.set(key, current);
    return map;
  }, new Map());

  const averageScore = snapshots.length
    ? Number((snapshots.reduce((sum, snapshot) => sum + snapshot.avgSentiment, 0) / snapshots.length).toFixed(1))
    : 0;

  return {
    summary: {
      averageScore,
      breakdown,
      campaignCount: campaigns.length,
      mentionVolume: breakdown.positive + breakdown.neutral + breakdown.negative,
    },
    byCampaign: campaigns.map((campaign) => ({
      id: campaign._id,
      title: campaign.title,
      brandName: campaign.brandName,
      status: campaign.status,
      score: campaign.sentimentSummary?.score || 0,
      positive: campaign.sentimentSummary?.positive || 0,
      neutral: campaign.sentimentSummary?.neutral || 0,
      negative: campaign.sentimentSummary?.negative || 0,
    })),
    trend: [...timeline.values()].map((entry) => ({
      date: entry.date,
      avgSentiment: entry.samples ? Number((entry.avgSentiment / entry.samples).toFixed(1)) : 0,
    })),
    mode: "generated",
    integrationNote: "AWS Comprehend sentiment is mocked until production credentials are configured.",
  };
};

const buildHealthScoreAnalytics = async (userId, role) => {
  const ownerFilter = role === "admin" ? {} : { owner: userId };
  const campaigns = await Campaign.find(ownerFilter).sort({ healthScore: -1 });

  const scores = campaigns.map((campaign) => campaign.healthScore || 0);
  const average = scores.length
    ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1))
    : 0;

  const distribution = {
    excellent: campaigns.filter((campaign) => (campaign.healthScore || 0) >= 80).length,
    good: campaigns.filter((campaign) => {
      const score = campaign.healthScore || 0;
      return score >= 65 && score < 80;
    }).length,
    atRisk: campaigns.filter((campaign) => (campaign.healthScore || 0) < 65).length,
  };

  return {
    average,
    distribution,
    items: campaigns.map((campaign) => ({
      id: campaign._id,
      title: campaign.title,
      brandName: campaign.brandName,
      status: campaign.status,
      healthScore: campaign.healthScore || 0,
      sentimentScore: campaign.sentimentSummary?.score || 0,
      insights: campaign.generatedInsights || [],
    })),
  };
};

module.exports = {
  buildSentimentAnalytics,
  buildHealthScoreAnalytics,
};
