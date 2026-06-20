const Campaign = require("../models/Campaign");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const {
  createDemoCampaigns,
  createDemoNotifications,
  createDemoReports,
  createDemoRobots,
  ensureCampaignAnalyticsSeeded,
} = require("./mockAnalyticsService");

const bootstrapDemoWorkspace = async (user) => {
  let campaigns = await Campaign.find({ owner: user._id });
  const analyticsCount = await AnalyticsSnapshot.countDocuments({ owner: user._id });

  if (!analyticsCount) {
    if (!campaigns.length) {
      campaigns = await createDemoCampaigns(user);
    } else {
      const seededCampaigns = campaigns.filter((campaign) =>
        ["active", "public", "completed", "scheduled"].includes(campaign.status),
      );

      if (seededCampaigns.length) {
        for (const campaign of seededCampaigns) {
          await ensureCampaignAnalyticsSeeded(campaign);
        }
      } else {
        campaigns = [...campaigns, ...(await createDemoCampaigns(user))];
      }
    }
  } else {
    for (const campaign of campaigns) {
      await ensureCampaignAnalyticsSeeded(campaign);
    }
  }

  await Promise.all([
    createDemoNotifications(user, campaigns),
    createDemoReports(user, campaigns),
    createDemoRobots(user, campaigns),
  ]);
};

module.exports = { bootstrapDemoWorkspace };
