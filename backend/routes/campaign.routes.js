const express = require("express");
const Campaign = require("../models/Campaign.model");
const { authMiddleware } = require("../middleware/auth");
const { calculateCampaignEstimate } = require("../utils/campaignPricing");
const {
  uploadCampaignFiles,
  cleanupUploadedFiles,
  sanitizeText,
  mapMediaAssets,
  toArray,
} = require("./campaigns.upload");
const path = require("path");
const fs = require("fs");
const {transporter,} = require("../services/email.service");

const User =require("../models/User");

const { verifyCampaign } = require("../services/campaignVerification");

const router = express.Router();

// GET /api/campaigns/public  — no auth required
router.get("/public", async (_req, res) => {
  try {
    const campaigns = await Campaign.find({ isPublic: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .select("-owner");
    res.status(200).json(campaigns);
  } catch {
    res.status(500).json({ message: "Failed to load public campaigns." });
  }
});

// GET /api/campaigns  — current user's campaigns
router.get("/", authMiddleware, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ owner: req.user.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(campaigns);
  } catch {
    res.status(500).json({ message: "Failed to load campaigns." });
  }
});

// GET /api/campaigns/:id  — single campaign (owner only)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      owner: req.user.userId, // users can't fetch someone else's campaign
    });
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found." });
    res.status(200).json(campaign);
  } catch {
    res.status(500).json({ message: "Failed to fetch campaign." });
  }
});

// POST /api/campaigns/:id/estimate
// Kept for manually recomputing a draft's estimate (e.g. if pricing config changes
// before payment). Nothing calls this automatically — the estimate is computed once
// at creation in POST "/" below.
router.post("/:id/estimate", authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found." });

    if (!campaign.startDate || !campaign.endDate || !campaign.repeatRate) {
      return res.status(400).json({
        message: "Campaign is missing startDate, endDate, or repeatRate.",
      });
    }

    const { durationDays, breakdown, avgDailyCost, budgetWarning } =
      calculateCampaignEstimate({
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        repeatRate: campaign.repeatRate,
        dailyBudgetCap: campaign.dailyBudgetCap,
      });

    campaign.estimatedCost = breakdown.estimatedCost;
    await campaign.save();

    return res.status(200).json({
      campaignId: campaign._id,
      durationDays,
      repeatRate: campaign.repeatRate,
      breakdown,
      avgDailyCost,
      dailyBudgetCap: campaign.dailyBudgetCap,
      budgetWarning,
    });
  } catch (err) {
    console.error("Estimate calculation error:", err);
    return res
      .status(500)
      .json({ message: "Failed to calculate estimate.", error: err.message });
  }
});

// POST /api/campaigns  — create new campaign
router.post("/", authMiddleware, uploadCampaignFiles, async (req, res) => {
  const files = req.files || [];
  console.log("BODY:", req.body);
  console.log(
    "FILES:",
    files.map((f) => f.originalname),
  );

  try {
    const {
      title,
      brandName,
      robotPlacement,
      destinationUrl,
      description,
      callToAction,
      spokenWords,
      slideText,
      locations,
      ageMin,
      ageMax,
      gender,
      interests,
      startDate,
      endDate,
      repeatRate,
      dailyBudgetCap,
    } = req.body;

    if (
      !title ||
      !brandName ||
      !robotPlacement ||
      !description ||
      !startDate ||
      !endDate ||
      !repeatRate ||
      !dailyBudgetCap
    ) {
      cleanupUploadedFiles(files);
      return res
        .status(400)
        .json({ message: "Please complete all required campaign fields." });
    }

    const mediaAssets = mapMediaAssets(files);
    const verification = verifyCampaign({
      title: sanitizeText(title),
      brandName: sanitizeText(brandName),
      robotPlacement: sanitizeText(robotPlacement),
      destinationUrl: sanitizeText(destinationUrl),
      description: sanitizeText(description),
      callToAction: sanitizeText(callToAction),
      spokenWords: sanitizeText(spokenWords),
      slideText: sanitizeText(slideText),
      mediaAssets,
    });

    const { breakdown } = calculateCampaignEstimate({
      startDate,
      endDate,
      repeatRate: Number(repeatRate),
      dailyBudgetCap: Number(dailyBudgetCap),
    });
    console.log("Computed breakdown:", breakdown);

    const campaign = await Campaign.create({
      owner: req.user.userId,
      title: sanitizeText(title),
      brandName: sanitizeText(brandName),
      robotPlacement: sanitizeText(robotPlacement),
      destinationUrl: sanitizeText(destinationUrl),
      description: sanitizeText(description),
      callToAction: sanitizeText(callToAction),
      spokenWords: sanitizeText(spokenWords),
      slideText: sanitizeText(slideText),
      mediaAssets,
      targeting: {
        locations: toArray(locations),
        ageRange: { min: Number(ageMin) || 18, max: Number(ageMax) || 65 },
        interests: toArray(interests),
        gender: gender || "all",
      },
      startDate,
      endDate,
      repeatRate: Number(repeatRate),
      dailyBudgetCap: Number(dailyBudgetCap),
      estimatedCost: breakdown.estimatedCost,
      // estimatedCost is locked in at creation — schedule/repeatRate/budget
      // cannot be edited after this point.
      verification,
      status: verification.status === "rejected" ? "rejected" : "pending_review",
      isPublic: false,
      publishedAt: null,
    });

    res.status(201).json(campaign);
  } catch (error) {
    cleanupUploadedFiles(files);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message:
          error.message || "Please complete all required campaign fields.",
      });
    }

    console.error("Campaign creation error:", error);
    res.status(500).json({ message: "Failed to create campaign." });
  }
});

// GET /api/campaigns/:id/report
// Download campaign report (PDF)

router.get(
  "/:id/report",
  async (req, res) => {
    try {
      const campaign =
        await Campaign.findById(
          req.params.id
        );

      if (!campaign) {
        return res.status(404).json({
          message:
            "Campaign not found",
        });
      }

      if (
        !campaign.report?.pdfPath
      ) {
        return res.status(404).json({
          message:
            "Report not generated yet",
        });
      }

      return res.download(
        campaign.report.pdfPath
      );
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  }
);

// Post route for sending email
router.post(
  "/:id/report/email",
  async (req, res) => {
    try {
      const campaign =
        await Campaign.findById(
          req.params.id
        );

      if (!campaign) {
        return res.status(404).json({
          message:
            "Campaign not found",
        });
      }

      if (
        !campaign.report?.pdfPath
      ) {
        return res.status(404).json({
          message:
            "Report not generated yet",
        });
      }

      const user =
        await User.findById(
          campaign.owner
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      await transporter.sendMail({
        from:
          process.env.EMAIL_USER,

        to: user.email,

        subject:
          "Campaign Report",

        text:
          `Your campaign "${campaign.title}" report is attached.`,

        attachments: [
          {
            filename:
              "CampaignReport.pdf",

            path:
              campaign.report
                .pdfPath,
          },
        ],
      });

      campaign.report
        .lastEmailedAt =
        new Date();

      campaign.report
        .emailCount += 1;

      await campaign.save();

      res.json({
        message:
          "Report emailed successfully",
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  }
);
module.exports = router;