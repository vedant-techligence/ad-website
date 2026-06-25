const crypto = require("crypto");
const mongoose = require("mongoose");
const path = require("path");

const Campaign = require("../models/Campaign");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { getPagination } = require("../utils/pagination");
const { calculateCampaignEstimate } = require("../utils/campaignPricing");
const {
  verifyCampaign,
  mapMediaAssets,
  cleanupUploadedFiles,
} = require("../services/campaignVerification");
const {
  ensureCampaignAnalyticsSeeded,
  buildCampaignComparison,
  syncCampaignDerivedMetrics,
} = require("../services/mockAnalyticsService");

const campaignSelect = [
  "title",
  "brandName",
  "robotPlacement",
  "description",
  "callToAction",
  "destinationUrl",
  "spokenWords",
  "slideText",
  "status",
  "publicationStatus",
  "isPublic",
  "publishedAt",
  "startDate",
  "endDate",
  "repeatRate",
  "dailyBudgetCap",
  "estimatedCost",
  "budget",
  "schedule",
  "healthScore",
  "sentimentSummary",
  "verification",
  "channels",
  "tags",
  "location",
  "targeting",
  "performanceGoals",
  "mediaAssets",
  "createdAt",
  "updatedAt",
];

const uploadsRoot = path.join(__dirname, "..", "uploads");

const sanitizeText = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .trim();

const toArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const parseImportedMediaAssets = (rawValue) => {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new ApiError(400, "importedMediaAssets must be valid JSON.");
  }
};

const normalizeImportedAsset = (asset) => ({
  originalName: asset.originalName || "imported-asset.mp4",
  storedName: asset.storedName || `imported-${crypto.randomUUID()}.mp4`,
  mimeType: asset.mimeType || "video/mp4",
  size: Number(asset.size) || 0,
  kind: asset.kind || "video",
  relativePath: asset.relativePath || `campaigns/imports/${asset.storedName || "imported-asset.mp4"}`,
  publicUrl: asset.publicUrl || `/uploads/campaigns/imports/${asset.storedName || "imported-asset.mp4"}`,
  source: asset.source || "google_drive",
  sourceUrl: asset.sourceUrl || null,
});

const buildTargeting = (body) => ({
  locations: toArray(body.locations),
  ageRange: {
    min: Number(body.ageMin) || 18,
    max: Number(body.ageMax) || 65,
  },
  interests: toArray(body.interests),
  gender: body.gender || "all",
  realTimeCrowdTargeting: body.realTimeCrowdTargeting === true || body.realTimeCrowdTargeting === "true",
  audienceSegments: toArray(body.audienceSegments),
  regions: toArray(body.regions),
  devices: toArray(body.devices),
});

const assertHasVideo = (mediaAssets) => {
  if (!mediaAssets.some((asset) => asset.kind === "video")) {
    throw new ApiError(400, "At least one video file is required per campaign.");
  }
};

const shouldSeedAnalytics = (status) => ["active", "public", "completed", "scheduled"].includes(status);

const listCampaigns = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filters = req.user.role === "admin" ? {} : { owner: req.user.userId };

  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.search) {
    filters.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { brandName: { $regex: req.query.search, $options: "i" } },
      { robotPlacement: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Campaign.find(filters).select(campaignSelect.join(" ")).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Campaign.countDocuments(filters),
  ]);

  res.status(200).json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const getCampaign = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, owner: req.user.userId };
  const campaign = await Campaign.findOne(filter).select(campaignSelect.join(" "));

  if (!campaign) {
    throw new ApiError(404, "Campaign not found.");
  }

  res.status(200).json({ item: campaign });
});

const createCampaign = asyncHandler(async (req, res) => {
  const uploadedFiles = req.files || [];

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
      dailyBudgetCap === undefined ||
      dailyBudgetCap === ""
    ) {
      throw new ApiError(400, "Please complete all required campaign fields.");
    }

    const importedAssets = parseImportedMediaAssets(req.body.importedMediaAssets).map(normalizeImportedAsset);
    const mediaAssets = [...mapMediaAssets(uploadedFiles), ...importedAssets];

    if (!mediaAssets.length) {
      throw new ApiError(400, "At least one media file (video) is required.");
    }

    assertHasVideo(mediaAssets);

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (parsedEndDate <= parsedStartDate) {
      throw new ApiError(400, "End date must be after the start date.");
    }

    const { breakdown } = calculateCampaignEstimate({
      startDate,
      endDate,
      repeatRate: Number(repeatRate),
      dailyBudgetCap: Number(dailyBudgetCap),
      videoDuration: req.body.videoDuration ? Number(req.body.videoDuration) : 30,
    });

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
      videoDuration: req.body.videoDuration ? Number(req.body.videoDuration) : 30,
      targeting: buildTargeting(req.body),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      repeatRate: Number(repeatRate),
      dailyBudgetCap: Number(dailyBudgetCap),
      estimatedCost: breakdown.estimatedCost,
      schedule: {
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
      channels: toArray(req.body.channels || "Robot Display, Interactive Kiosk"),
      tags: toArray(req.body.tags),
      location: {
        city: sanitizeText(req.body.city),
        venue: sanitizeText(req.body.venue),
        lat: req.body.lat !== undefined && req.body.lat !== "" ? Number(req.body.lat) : 28.6139,
        lng: req.body.lng !== undefined && req.body.lng !== "" ? Number(req.body.lng) : 77.209,
      },
      status: "draft",
      isPublic: false,
      publishedAt: null,
      verification: {
        status: "pending",
        riskLevel: "low",
        checkedAt: null,
        approvedAt: null,
        flaggedTerms: [],
        issues: [],
        checksSummary: "Draft saved. Verification runs after payment.",
      },
    });

    res.status(201).json(campaign);
  } catch (error) {
    cleanupUploadedFiles(uploadedFiles);
    throw error;
  }
});

const updateCampaign = asyncHandler(async (req, res) => {
  const uploadedFiles = req.files || [];
  const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, owner: req.user.userId };
  const campaign = await Campaign.findOne(filter);

  if (!campaign) {
    cleanupUploadedFiles(uploadedFiles);
    throw new ApiError(404, "Campaign not found.");
  }

  try {
    const importedAssets = parseImportedMediaAssets(req.body.importedMediaAssets).map(normalizeImportedAsset);
    const appendedAssets = [...campaign.mediaAssets, ...mapMediaAssets(uploadedFiles), ...importedAssets];

    if (!appendedAssets.length) {
      throw new ApiError(400, "Campaign must retain at least one media asset.");
    }

    assertHasVideo(appendedAssets);

    const nextTitle = req.body.title !== undefined ? sanitizeText(req.body.title) : campaign.title;
    const nextBrandName = req.body.brandName !== undefined ? sanitizeText(req.body.brandName) : campaign.brandName;
    const nextPlacement =
      req.body.robotPlacement !== undefined ? sanitizeText(req.body.robotPlacement) : campaign.robotPlacement;
    const nextDescription =
      req.body.description !== undefined ? sanitizeText(req.body.description) : campaign.description;

    campaign.set({
      title: nextTitle,
      brandName: nextBrandName,
      robotPlacement: nextPlacement,
      destinationUrl:
        req.body.destinationUrl !== undefined ? sanitizeText(req.body.destinationUrl) : campaign.destinationUrl,
      description: nextDescription,
      callToAction: req.body.callToAction !== undefined ? sanitizeText(req.body.callToAction) : campaign.callToAction,
      spokenWords: req.body.spokenWords !== undefined ? sanitizeText(req.body.spokenWords) : campaign.spokenWords,
      slideText: req.body.slideText !== undefined ? sanitizeText(req.body.slideText) : campaign.slideText,
      mediaAssets: appendedAssets,
    });

    if (req.body.videoDuration !== undefined) {
      campaign.videoDuration = Number(req.body.videoDuration);
    }

    if (req.body.realTimeCrowdTargeting !== undefined) {
      campaign.targeting.realTimeCrowdTargeting = req.body.realTimeCrowdTargeting === true || req.body.realTimeCrowdTargeting === "true";
    }

    if (req.body.startDate) {
      campaign.startDate = new Date(req.body.startDate);
      campaign.schedule.startDate = campaign.startDate;
    }

    if (req.body.endDate) {
      campaign.endDate = new Date(req.body.endDate);
      campaign.schedule.endDate = campaign.endDate;
    }

    if (req.body.repeatRate !== undefined && req.body.repeatRate !== "") {
      campaign.repeatRate = Number(req.body.repeatRate);
    }

    if (req.body.dailyBudgetCap !== undefined && req.body.dailyBudgetCap !== "") {
      campaign.dailyBudgetCap = Number(req.body.dailyBudgetCap);
    }

    if (campaign.startDate && campaign.endDate && campaign.endDate <= campaign.startDate) {
      throw new ApiError(400, "End date must be after the start date.");
    }

    if (["draft", "pending_payment"].includes(campaign.status)) {
      campaign.verification = {
        status: "pending",
        riskLevel: "low",
        checkedAt: null,
        approvedAt: null,
        flaggedTerms: [],
        issues: [],
        checksSummary: "Draft updated. Verification runs after payment.",
      };
    } else {
      const verification = verifyCampaign({
        title: campaign.title,
        brandName: campaign.brandName,
        robotPlacement: campaign.robotPlacement,
        destinationUrl: campaign.destinationUrl,
        description: campaign.description,
        callToAction: campaign.callToAction,
        spokenWords: campaign.spokenWords,
        slideText: campaign.slideText,
        mediaAssets: campaign.mediaAssets,
      });

      campaign.verification = verification;
      campaign.isPublic = verification.status === "approved";
      campaign.publicationStatus = verification.status === "approved" ? "public" : "blocked";
      campaign.publishedAt = verification.status === "approved" ? verification.approvedAt : null;
    }

    await campaign.save();

    if (shouldSeedAnalytics(campaign.status)) {
      await ensureCampaignAnalyticsSeeded(campaign);
      await syncCampaignDerivedMetrics(campaign._id);
    }

    res.status(200).json(campaign);
  } catch (error) {
    cleanupUploadedFiles(uploadedFiles);
    throw error;
  }
});

const deleteCampaign = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, owner: req.user.userId };
  const campaign = await Campaign.findOneAndDelete(filter);

  if (!campaign) {
    throw new ApiError(404, "Campaign not found.");
  }

  await AnalyticsSnapshot.deleteMany({ campaign: campaign._id });

  cleanupUploadedFiles(
    (campaign.mediaAssets || []).map((asset) => ({
      path: asset.relativePath ? path.join(uploadsRoot, asset.relativePath) : null,
    })),
  );

  res.status(200).json({ message: "Campaign deleted successfully." });
});

const getPublicCampaigns = asyncHandler(async (_req, res) => {
  const items = await Campaign.find({ isPublic: true })
    .select(campaignSelect.join(" "))
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(12);

  res.status(200).json({ items });
});

const estimateCampaign = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, owner: req.user.userId };
  const campaign = await Campaign.findOne(filter);

  if (!campaign) {
    throw new ApiError(404, "Campaign not found.");
  }

  if (!campaign.startDate || !campaign.endDate || !campaign.repeatRate) {
    throw new ApiError(400, "Campaign is missing startDate, endDate, or repeatRate.");
  }

  const { durationDays, breakdown, avgDailyCost, budgetWarning } = calculateCampaignEstimate({
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    repeatRate: campaign.repeatRate,
    dailyBudgetCap: campaign.dailyBudgetCap,
    videoDuration: campaign.videoDuration || 30,
  });

  campaign.estimatedCost = breakdown.estimatedCost;
  await campaign.save();

  res.status(200).json({
    campaignId: campaign._id,
    durationDays,
    repeatRate: campaign.repeatRate,
    breakdown,
    avgDailyCost,
    dailyBudgetCap: campaign.dailyBudgetCap,
    budgetWarning,
  });
});

const importDriveVideo = asyncHandler(async (req, res) => {
  const driveUrl = sanitizeText(req.body.driveUrl);

  if (!driveUrl) {
    throw new ApiError(400, "Paste a Google Drive share link first.");
  }

  if (!/^https?:\/\//i.test(driveUrl)) {
    throw new ApiError(400, "Drive URL must start with http:// or https://.");
  }

  const storedName = `drive-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.mp4`;

  res.status(200).json({
    mediaAsset: {
      originalName: "google-drive-import.mp4",
      storedName,
      mimeType: "video/mp4",
      size: 1024 * 1024 * 4,
      kind: "video",
      relativePath: `campaigns/imports/${storedName}`,
      publicUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      source: "google_drive",
      sourceUrl: driveUrl,
    },
    mode: "mock",
    integrationNote: "Google Drive import is mocked until cloud storage ingestion is connected.",
  });
});

const getCampaignHealth = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, owner: req.user.userId };
  const campaign = await Campaign.findOne(filter);

  if (!campaign) {
    throw new ApiError(404, "Campaign not found.");
  }

  const snapshots = await AnalyticsSnapshot.find({ campaign: campaign._id }).sort({ date: -1 }).limit(14);
  const latest = snapshots[0];

  res.status(200).json({
    item: {
      campaignId: campaign._id,
      title: campaign.title,
      score: campaign.healthScore,
      components: {
        sentiment: campaign.sentimentSummary?.score || 0,
        engagement: Number((latest?.ctr || 0).toFixed(2)),
        conversion: Number((latest?.cvr || 0).toFixed(2)),
        budgetEfficiency: campaign.budget.allocated
          ? Number(((1 - campaign.budget.spent / campaign.budget.allocated) * 100).toFixed(2))
          : 0,
      },
      status: campaign.status,
      publicationStatus: campaign.publicationStatus,
    },
  });
});

const compareCampaigns = asyncHandler(async (req, res) => {
  const campaignIds = String(req.query.campaignIds || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (campaignIds.length < 2) {
    throw new ApiError(400, "Provide at least two campaign IDs to compare.");
  }

  const objectIds = campaignIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const filter = req.user.role === "admin" ? { _id: { $in: objectIds } } : { _id: { $in: objectIds }, owner: req.user.userId };
  const campaigns = await Campaign.find(filter);

  if (campaigns.length < 2) {
    throw new ApiError(404, "Two or more valid campaigns are required for comparison.");
  }

  const comparison = await buildCampaignComparison(campaigns);
  res.status(200).json(comparison);
});

module.exports = {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getPublicCampaigns,
  estimateCampaign,
  importDriveVideo,
  getCampaignHealth,
  compareCampaigns,
};
