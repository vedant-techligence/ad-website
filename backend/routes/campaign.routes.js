const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const Campaign = require("../models/Campaign.model");
const { authMiddleware } = require("../middleware/auth");
// NOTE: verifyCampaign is intentionally NOT called during creation anymore.
// Verification now happens after payment, as a separate step (handled by the
// verification teammate's service / an internal endpoint). Keeping the import
// here commented so it's easy to find when that endpoint gets built.
// const { verifyCampaign } = require("../services/campaignVerification");

const router = express.Router();

const uploadsRoot = path.join(__dirname, "..", "uploads");
const campaignsUploadRoot = path.join(uploadsRoot, "campaigns");
fs.mkdirSync(campaignsUploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, campaignsUploadRoot);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "");
    const safeBaseName = path
      .basename(file.originalname || "asset", extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 60);
    cb(
      null,
      `${Date.now()}-${safeBaseName}-${crypto.randomUUID()}${extension.toLowerCase()}`,
    );
  },
});

const upload = multer({
  storage,
  limits: {
    files: 6,
    fileSize: 80 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image and video uploads are allowed."));
  },
});

const uploadCampaignFiles = (req, res, next) => {
  upload.array("mediaFiles", 6)(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    const message =
      err instanceof multer.MulterError
        ? err.code === "LIMIT_FILE_SIZE"
          ? "Each file must be 80 MB or smaller."
          : err.message
        : err.message || "Failed to upload campaign files.";

    res.status(400).json({ message });
  });
};

const cleanupUploadedFiles = (files = []) => {
  files.forEach((file) => {
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

const sanitizeText = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .trim();

const mapMediaAssets = (files = []) =>
  files.map((file) => {
    const relativePath = path
      .relative(uploadsRoot, file.path)
      .split(path.sep)
      .join("/");

    return {
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      kind: file.mimetype.startsWith("image/") ? "image" : "video",
      relativePath,
      publicUrl: `/uploads/${relativePath}`,
    };
  });

// normalize array-ish fields whether they arrive as CSV string or actual array
const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

router.get("/public", async (_req, res) => {
  try {
    const campaigns = await Campaign.find({ isPublic: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .select("-owner");

    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Failed to load public campaigns." });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ owner: req.user.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Failed to load campaigns." });
  }
});

// single campaign detail — used on the review/payment step
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      owner: req.user.userId, // ensures users can't fetch someone else's campaign
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch campaign." });
  }
});

const { calculateCampaignEstimate } = require("../utils/campaignPricing");

// Kept around for manually recomputing a draft's estimate later (e.g. if
// config/pricing.js changes before payment). Nothing calls this automatically
// anymore — the estimate is now computed once, at creation, in POST "/" below.
router.post("/:id/estimate", authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

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

    // required-field check — covers both content fields and the new scheduling fields
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

    if (files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one media file (video) is required." });
    }

    const mediaAssets = mapMediaAssets(files);

    if (!mediaAssets.some((a) => a.kind === "video")) {
      cleanupUploadedFiles(files);
      return res
        .status(400)
        .json({ message: "At least one video file is required per campaign." });
    }

    const payload = {
      title: sanitizeText(title),
      brandName: sanitizeText(brandName),
      robotPlacement: sanitizeText(robotPlacement),
      destinationUrl: sanitizeText(destinationUrl),
      description: sanitizeText(description),
      callToAction: sanitizeText(callToAction),
      spokenWords: sanitizeText(spokenWords),
      slideText: sanitizeText(slideText),
    };

    const { breakdown } = calculateCampaignEstimate({
      startDate,
      endDate,
      repeatRate: Number(repeatRate),
      dailyBudgetCap: Number(dailyBudgetCap),
    });
    console.log("Computed breakdown:", breakdown);
    const campaign = await Campaign.create({
      owner: req.user.userId,
      ...payload,
      mediaAssets,
      targeting: {
        locations: toArray(locations),
        ageRange: {
          min: Number(ageMin) || 18,
          max: Number(ageMax) || 65,
        },
        interests: toArray(interests),
        gender: gender || "all",
      },
      startDate,
      endDate,
      repeatRate: Number(repeatRate),
      dailyBudgetCap: Number(dailyBudgetCap),
      estimatedCost: breakdown.estimatedCost,
      // No verification yet, no payment yet — campaign starts as a draft.
      // estimatedCost is locked in right now since nothing about the
      // schedule, repeatRate, or budget can be edited after creation.
      status: "draft",
      isPublic: false,
      publishedAt: null,
    });

    res.status(201).json(campaign);
  } catch (error) {
    cleanupUploadedFiles(files);

    if (error.name === "ValidationError") {
      res.status(400).json({
        message:
          error.message || "Please complete all required campaign fields.",
      });
      return;
    }

    console.error("Campaign creation error:", error);
    res.status(500).json({ message: "Failed to create campaign." });
  }
});

module.exports = router;
