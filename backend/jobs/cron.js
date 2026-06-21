const cron = require("node-cron");

const {
  completeCampaigns,
} = require("./campaign.job");

cron.schedule("* * * * *", async () => {
  console.log(
    "Checking expired campaigns..."
  );

  await completeCampaigns();
});