const express = require("express");
const router = express.Router();
const Campaign = require("../models/Campaign.model");
const { generateCampaignPdf } = require("../services/pdf.service");

router.patch(
  "/campaigns/:id/complete",
  async (req, res) => {
    try {
      const campaign =await Campaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({
          message: "Campaign not found",
        });
      }

      campaign.status = "completed";

      // Generate PDF
      const pdfPath = await generateCampaignPdf(campaign);

      // Save report details
      campaign.report.generatedAt = new Date();
      campaign.report.pdfPath = pdfPath;

      await campaign.save();

      res.json({
        message: "Campaign completed",
        pdfPath,
        campaign,
      });
      
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;