const Campaign = require("../models/Campaign");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const Notification = require("../models/Notification");
const Report = require("../models/Report");
const Robot = require("../models/Robot");
const { verifyCampaign } = require("./campaignVerification");

const campaignBlueprints = [
  {
    title: "Metro Launch Pulse",
    brandName: "Techligence Robots",
    robotPlacement: "Delhi Metro entry concourse",
    description: "Drive awareness for interactive robot advertising with a scan-to-demo CTA.",
    callToAction: "Book a live demo",
    spokenWords: "Meet the robot that turns footfall into measurable brand lift.",
    slideText: "Interactive robot campaigns, measurable reach, live analytics.",
    channels: ["Robot Display", "Interactive Kiosk", "QR Activation"],
    tags: ["launch", "high-footfall", "metro"],
    location: { city: "New Delhi", venue: "Rajiv Chowk", lat: 28.6328, lng: 77.2197 },
  },
  {
    title: "Mall Weekend Engagement",
    brandName: "Retail Spark",
    robotPlacement: "Premium mall atrium",
    description: "Promote seasonal retail offers with playful robot-led motion content.",
    callToAction: "Scan for offers",
    spokenWords: "Weekend offers just got smarter. Scan and save instantly.",
    slideText: "Offers, coupons, and guided retail discovery powered by robots.",
    channels: ["Robot Display", "Voice Prompt"],
    tags: ["retail", "weekend", "offers"],
    location: { city: "Gurugram", venue: "CyberHub Atrium", lat: 28.4941, lng: 77.0881 },
  },
  {
    title: "Clinic Trust Builder",
    brandName: "CareConnect",
    robotPlacement: "Hospital reception",
    description: "Help visitors discover appointments, diagnostics, and care packages.",
    callToAction: "Reserve a consultation",
    spokenWords: "Your care journey can begin right here with one simple scan.",
    slideText: "Appointments, diagnostics, specialist support, all from the lobby.",
    channels: ["Robot Display", "Interactive Kiosk"],
    tags: ["healthcare", "trust", "guided-journey"],
    location: { city: "Noida", venue: "Sector 18 Medical Hub", lat: 28.5707, lng: 77.3272 },
  },
];

const robotBlueprints = [
  { name: "Atlas-01", robotCode: "TL-RBT-101", city: "New Delhi", lat: 28.6321, lng: 77.2185 },
  { name: "Atlas-02", robotCode: "TL-RBT-102", city: "New Delhi", lat: 28.6156, lng: 77.2089 },
  { name: "Nova-11", robotCode: "TL-RBT-201", city: "Gurugram", lat: 28.4949, lng: 77.0877 },
  { name: "Nova-12", robotCode: "TL-RBT-202", city: "Noida", lat: 28.5715, lng: 77.3259 },
];

const hashNumber = (input) =>
  [...String(input)].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);

const seeded = (seed) => {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
};

const range = (length) => Array.from({ length }, (_value, index) => index);

const createSnapshotsForCampaign = async (campaign) => {
  const existing = await AnalyticsSnapshot.countDocuments({ campaign: campaign._id });
  if (existing) {
    return;
  }

  const baseSeed = hashNumber(campaign._id);
  const today = new Date();
  const snapshots = range(30).map((offset) => {
    const seed = baseSeed + offset * 17;
    const impressions = Math.round(3500 + seeded(seed) * 6500);
    const ctr = 2.1 + seeded(seed + 1) * 4.2;
    const clicks = Math.round((impressions * ctr) / 100);
    const conversions = Math.round(clicks * (0.1 + seeded(seed + 2) * 0.18));
    const spend = Number((180 + seeded(seed + 3) * 320).toFixed(2));
    const revenue = Number((spend * (1.7 + seeded(seed + 4) * 1.9)).toFixed(2));
    const engagements = Math.round(impressions * (0.08 + seeded(seed + 5) * 0.12));
    const avgSentiment = Math.round(56 + seeded(seed + 6) * 34);
    const healthScore = Math.round(60 + seeded(seed + 7) * 35);
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (29 - offset));

    return {
      owner: campaign.owner,
      campaign: campaign._id,
      date,
      impressions,
      reach: Math.round(impressions * (0.74 + seeded(seed + 8) * 0.14)),
      engagements,
      clicks,
      conversions,
      spend,
      revenue,
      ctr: Number(ctr.toFixed(2)),
      cvr: clicks ? Number(((conversions / clicks) * 100).toFixed(2)) : 0,
      roas: spend ? Number((revenue / spend).toFixed(2)) : 0,
      completionRate: Number((68 + seeded(seed + 9) * 28).toFixed(2)),
      avgSentiment,
      positiveMentions: Math.round(90 + seeded(seed + 10) * 70),
      neutralMentions: Math.round(30 + seeded(seed + 11) * 35),
      negativeMentions: Math.round(8 + seeded(seed + 12) * 18),
      robotInteractions: Math.round(100 + seeded(seed + 13) * 180),
      dwellTimeSec: Number((20 + seeded(seed + 14) * 25).toFixed(1)),
      healthScore,
    };
  });

  await AnalyticsSnapshot.insertMany(snapshots);
};

const syncCampaignDerivedMetrics = async (campaignId) => {
  const [campaign, snapshots] = await Promise.all([
    Campaign.findById(campaignId),
    AnalyticsSnapshot.find({ campaign: campaignId }).sort({ date: -1 }).limit(30),
  ]);

  if (!campaign || !snapshots.length) {
    return campaign;
  }

  const totals = snapshots.reduce(
    (accumulator, snapshot) => {
      accumulator.spend += snapshot.spend;
      accumulator.impressions += snapshot.impressions;
      accumulator.conversions += snapshot.conversions;
      accumulator.sentiment += snapshot.avgSentiment;
      accumulator.health += snapshot.healthScore;
      accumulator.positive += snapshot.positiveMentions;
      accumulator.neutral += snapshot.neutralMentions;
      accumulator.negative += snapshot.negativeMentions;
      return accumulator;
    },
    {
      spend: 0,
      impressions: 0,
      conversions: 0,
      sentiment: 0,
      health: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
    },
  );

  const healthScore = Number((totals.health / snapshots.length).toFixed(1));
  const sentimentScore = Number((totals.sentiment / snapshots.length).toFixed(1));

  campaign.budget.spent = Number(totals.spend.toFixed(2));
  campaign.healthScore = healthScore;
  campaign.sentimentSummary = {
    positive: totals.positive,
    neutral: totals.neutral,
    negative: totals.negative,
    score: sentimentScore,
  };
  campaign.generatedInsights = [
    `${campaign.title} is pacing at ${totals.impressions.toLocaleString("en-IN")} impressions over the last 30 days.`,
    `Average sentiment is ${sentimentScore}, driven by ${totals.positive.toLocaleString("en-IN")} positive mentions.`,
    `Campaign health is ${healthScore}, indicating ${
      healthScore >= 75 ? "strong delivery momentum" : "room to improve message or placement"
    }.`,
  ];

  await campaign.save();
  return campaign;
};

const ensureCampaignAnalyticsSeeded = async (campaign) => {
  await createSnapshotsForCampaign(campaign);
  await syncCampaignDerivedMetrics(campaign._id);
};

const createDemoCampaigns = async (user) => {
  const campaigns = [];

  for (const [index, blueprint] of campaignBlueprints.entries()) {
    const verification = {
      status: "approved",
      riskLevel: "low",
      checkedAt: new Date(),
      approvedAt: new Date(),
      flaggedTerms: [],
      issues: [],
      checksSummary: "Demo campaign approved with generated placeholder verification for dashboard bootstrapping.",
    };

    const campaign = await Campaign.create({
      owner: user._id,
      ...blueprint,
      destinationUrl: `https://techligence.in/demo/${index + 1}`,
      verification,
      status: index === 2 ? "scheduled" : "active",
      publicationStatus: "public",
      isPublic: true,
      publishedAt: new Date(),
      budget: {
        allocated: 12000 + index * 3500,
        spent: 0,
        currency: "USD",
      },
      schedule: {
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * (12 - index * 2)),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (18 + index * 5)),
      },
      targeting: {
        audienceSegments: ["Commuters", "Shoppers", "Operators"].slice(0, 2 + (index % 2)),
        regions: [blueprint.location.city, "NCR"],
        devices: ["QR", "Touchscreen", "Voice"],
      },
      performanceGoals: {
        impressions: 180000 + index * 30000,
        conversions: 2800 + index * 450,
        engagementRate: 7.2 + index * 0.6,
      },
      sentimentSummary: {
        positive: 0,
        neutral: 0,
        negative: 0,
        score: 0,
      },
      healthScore: 0,
      generatedInsights: [],
    });

    await ensureCampaignAnalyticsSeeded(campaign);
    campaigns.push(await Campaign.findById(campaign._id));
  }

  return campaigns;
};

const createDemoNotifications = async (user, campaigns) => {
  const existing = await Notification.countDocuments({ owner: user._id });
  if (existing) {
    return;
  }

  await Notification.insertMany([
    {
      owner: user._id,
      title: "Campaign health alert",
      message: `${campaigns[1].title} dropped 4 points in health after midday traffic slowed.`,
      type: "health",
      severity: "warning",
      entityType: "campaign",
      entityId: campaigns[1]._id,
      ctaLabel: "Review campaign",
      ctaUrl: "/campaigns",
    },
    {
      owner: user._id,
      title: "New executive report ready",
      message: "Your 30-day executive analytics report has been generated.",
      type: "report",
      severity: "success",
      ctaLabel: "Open reports",
      ctaUrl: "/reports",
    },
    {
      owner: user._id,
      title: "Robot cluster moved to a high-footfall zone",
      message: "Two robots in New Delhi are now serving a stronger evening audience mix.",
      type: "geo",
      severity: "info",
      ctaLabel: "View geo analytics",
      ctaUrl: "/dashboard",
    },
    {
      owner: user._id,
      title: "Mock AI integrations available",
      message: "Rekognition, Whisper, Transcribe, and moderation APIs are exposed as mock endpoints.",
      type: "system",
      severity: "info",
      ctaLabel: "Inspect roadmap",
      ctaUrl: "/reports",
    },
  ]);
};

const createDemoReports = async (user, campaigns) => {
  const existing = await Report.countDocuments({ owner: user._id });
  if (existing) {
    return;
  }

  await Report.insertMany([
    {
      owner: user._id,
      name: "Executive Performance Snapshot",
      type: "executive",
      status: "ready",
      format: "json",
      summary: "High-level revenue, health, and placement efficiency report for leadership.",
      metrics: {
        campaigns: campaigns.length,
        avgHealth: Math.round(campaigns.reduce((sum, campaign) => sum + campaign.healthScore, 0) / campaigns.length),
      },
      sections: [
        { title: "Wins", points: ["Robot Display remains the top-performing channel.", "Sentiment is stable across NCR."] },
      ],
    },
    {
      owner: user._id,
      name: "Geo Reach Digest",
      type: "geo",
      status: "ready",
      format: "json",
      summary: "Robot deployment coverage, city-level exposure, and routing performance.",
      metrics: { cities: 3, activeRobots: 4 },
      sections: [
        { title: "Coverage", points: ["New Delhi and Gurugram contribute the highest daily impressions."] },
      ],
    },
  ]);
};

const createDemoRobots = async (user, campaigns) => {
  const existing = await Robot.countDocuments({ owner: user._id });
  if (existing) {
    return;
  }

  const robots = robotBlueprints.map((blueprint, index) => ({
    owner: user._id,
    name: blueprint.name,
    robotCode: blueprint.robotCode,
    city: blueprint.city,
    status: index === 3 ? "charging" : "active",
    batteryLevel: 55 + index * 10,
    networkQuality: 72 + index * 6,
    uptimePct: 97.2 + index * 0.5,
    todayImpressions: 3200 + index * 850,
    assignedCampaigns: [campaigns[index % campaigns.length]._id],
    currentLocation: {
      lat: blueprint.lat,
      lng: blueprint.lng,
      address: blueprint.city,
      lastSeen: new Date(),
    },
    routeHistory: range(4).map((step) => ({
      lat: Number((blueprint.lat + step * 0.002).toFixed(6)),
      lng: Number((blueprint.lng + step * 0.0015).toFixed(6)),
      address: `${blueprint.city} waypoint ${step + 1}`,
      timestamp: new Date(Date.now() - (4 - step) * 1000 * 60 * 40),
    })),
  }));

  await Robot.insertMany(robots);
};

const buildCampaignComparison = async (campaigns) => {
  const analytics = await AnalyticsSnapshot.find({
    campaign: { $in: campaigns.map((campaign) => campaign._id) },
  }).sort({ date: 1 });

  const grouped = campaigns.map((campaign) => {
    const snapshots = analytics.filter((snapshot) => String(snapshot.campaign) === String(campaign._id));
    const totals = snapshots.reduce(
      (accumulator, snapshot) => {
        accumulator.impressions += snapshot.impressions;
        accumulator.clicks += snapshot.clicks;
        accumulator.conversions += snapshot.conversions;
        accumulator.spend += snapshot.spend;
        accumulator.revenue += snapshot.revenue;
        return accumulator;
      },
      { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 },
    );

    return {
      id: campaign._id,
      title: campaign.title,
      brandName: campaign.brandName,
      status: campaign.status,
      channelMix: campaign.channels,
      healthScore: campaign.healthScore,
      sentimentScore: campaign.sentimentSummary?.score || 0,
      impressions: totals.impressions,
      conversions: totals.conversions,
      spend: Number(totals.spend.toFixed(2)),
      revenue: Number(totals.revenue.toFixed(2)),
      ctr: totals.impressions ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
      roas: totals.spend ? Number((totals.revenue / totals.spend).toFixed(2)) : 0,
    };
  });

  return {
    items: grouped,
    winner: grouped.slice().sort((left, right) => right.healthScore - left.healthScore)[0] || null,
  };
};

module.exports = {
  createDemoCampaigns,
  createDemoNotifications,
  createDemoReports,
  createDemoRobots,
  ensureCampaignAnalyticsSeeded,
  syncCampaignDerivedMetrics,
  buildCampaignComparison,
};
