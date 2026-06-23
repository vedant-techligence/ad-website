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

// POST /api/campaigns/import-drive-video
// Downloads a video from a Google Drive share link to local disk,
// returns a mediaAsset object in the same shape as a direct upload.
const { extractDriveFileId, buildDriveDownloadUrl, downloadFileFromUrl } = require("../utils/driveImport");
const crypto = require("crypto");

router.post("/import-drive-video", authMiddleware, async (req, res) => {
  const { driveUrl } = req.body;

  if (!driveUrl || typeof driveUrl !== "string" || !driveUrl.trim()) {
    return res.status(400).json({ message: "driveUrl is required." });
  }

  const fileId = extractDriveFileId(driveUrl.trim());
  if (!fileId) {
    return res.status(400).json({
      message: "Couldn't extract a file ID from that link. Make sure it's a valid Google Drive share URL.",
    });
  }

  try {
    const uploadDir = path.join(__dirname, "../uploads/campaigns");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const downloadUrl = buildDriveDownloadUrl(fileId);
    const { path: filePath, size, contentType } = await downloadFileFromUrl(downloadUrl, uploadDir);

    const storedName = path.basename(filePath);
    const originalName = `drive-${fileId}.mp4`;

    const mediaAsset = {
      originalName,
      storedName,
      mimeType: contentType.split(";")[0].trim() || "video/mp4",
      size,
      kind: "video",
      relativePath: `campaigns/${storedName}`,
      publicUrl: `/uploads/campaigns/${storedName}`,
      source: "drive",
      sourceUrl: driveUrl.trim(),
    };

    return res.status(200).json({ mediaAsset });
  } catch (err) {
    console.error("Drive import error:", err);
    return res.status(500).json({
      message: err.message || "Failed to import video from Google Drive.",
    });
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
// PATCH /api/campaigns/:id/verify
// Internal handoff endpoint — called by Yash's verification service or admin
// to flip a paid_pending_verification campaign to public or rejected.
const { adminMiddleware } = require("../middleware/admin");

router.patch("/:id/verify", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, issues, flaggedTerms, checksSummary, riskLevel } = req.body;

    if (!["public", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be 'public' or 'rejected'." });
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    if (campaign.status !== "paid_pending_verification") {
      return res.status(400).json({
        message: `Campaign is in '${campaign.status}' — can only verify paid_pending_verification campaigns.`,
      });
    }

    campaign.status = status;
    campaign.isPublic = status === "public";
    campaign.publishedAt = status === "public" ? new Date() : null;
    campaign.verification.status = status === "public" ? "approved" : "rejected";
    campaign.verification.checkedAt = new Date();
    campaign.verification.approvedAt = status === "public" ? new Date() : null;
    campaign.verification.issues = issues || [];
    campaign.verification.flaggedTerms = flaggedTerms || [];
    campaign.verification.checksSummary = checksSummary || "";
    campaign.verification.riskLevel = riskLevel || "low";

    await campaign.save();

    return res.status(200).json({ success: true, data: campaign });
  } catch (err) {
    console.error("Verify campaign error:", err);
    return res.status(500).json({ message: "Failed to verify campaign.", error: err.message });
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