const Campaign = require("../models/Campaign");
const {
  createDemoCampaigns,
  createDemoNotifications,
  createDemoReports,
  createDemoRobots,
  ensureCampaignAnalyticsSeeded,
} = require("./mockAnalyticsService");

const bootstrapDemoWorkspace = async (user) => {
  let campaigns = await Campaign.find({ owner: user._id });

  if (!campaigns.length) {
    campaigns = await createDemoCampaigns(user);
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
