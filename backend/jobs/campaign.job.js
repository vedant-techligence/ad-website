const Campaign = require("../models/Campaign.model");
const { generateCampaignPdf, } = require("../services/pdf.service");

const completeCampaigns =
  async () => {
    try {
      const campaigns =
        await Campaign.find({
          status: "public",
          endDate: {
            $lt: new Date(),
          },
        });

      for (const campaign of campaigns) {
        try {
          // Generate report only once
          let pdfPath =
            campaign.report?.pdfPath;

          if (!pdfPath) {
            pdfPath =
              await generateCampaignPdf(
                campaign
              );
          }

          await Campaign.updateOne(
            {
              _id: campaign._id,
            },
            {
              $set: {
                status:
                  "completed",
                "report.generatedAt":
                  new Date(),
                "report.pdfPath":
                  pdfPath,
              },
            }
          );

          console.log(
            `Campaign ${campaign._id} completed`
          );
        } catch (err) {
          console.error(
            `Failed to complete campaign ${campaign._id}`,
            err
          );
        }
      }

      console.log(
        `${campaigns.length} campaigns completed`
      );
    } catch (err) {
      console.error(
        "Campaign completion error:",
        err
      );
    }
  };

module.exports = {
  completeCampaigns,
};
