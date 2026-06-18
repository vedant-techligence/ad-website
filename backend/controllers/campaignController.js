const mongoose = require("mongoose");
const path = require("path");

const Campaign = require("../models/Campaign");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { getPagination } = require("../utils/pagination");
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

const buildCampaignPayload = (body) => ({
  title: body.title,
  brandName: body.brandName,
  robotPlacement: body.robotPlacement,
  destinationUrl: body.destinationUrl || "",
  description: body.description,
  callToAction: body.callToAction || "",
  spokenWords: body.spokenWords || "",
  slideText: body.slideText || "",
  status: body.status || "active",
  publicationStatus: body.publicationStatus || "public",
  budget: {
    allocated: Number(body.budgetAllocated || body?.budget?.allocated || 0),
    spent: Number(body.budgetSpent || body?.budget?.spent || 0),
    currency: body.budgetCurrency || body?.budget?.currency || "USD",
  },
  schedule: {
    startDate: body.startDate || body?.schedule?.startDate || null,
    endDate: body.endDate || body?.schedule?.endDate || null,
  },
  targeting: {
    audienceSegments: String(body.audienceSegments || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    regions: String(body.regions || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    devices: String(body.devices || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  },
  channels: String(body.channels || "Robot Display, Interactive Kiosk")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
  tags: String(body.tags || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
  location: {
    city: body.city || "",
    venue: body.venue || "",
    lat: body.lat !== undefined && body.lat !== "" ? Number(body.lat) : 28.6139,
    lng: body.lng !== undefined && body.lng !== "" ? Number(body.lng) : 77.209,
  },
  performanceGoals: {
    impressions: Number(body.goalImpressions || 100000),
    conversions: Number(body.goalConversions || 1500),
    engagementRate: Number(body.goalEngagementRate || 6.5),
  },
});

const uploadsRoot = path.join(__dirname, "..", "uploads");

const listCampaigns = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filters = { owner: req.user.userId };

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
  const campaign = await Campaign.findOne({
    _id: req.params.id,
    owner: req.user.userId,
  }).select(campaignSelect.join(" "));

  if (!campaign) {
    throw new ApiError(404, "Campaign not found.");
  }

  res.status(200).json({ item: campaign });
});

const createCampaign = asyncHandler(async (req, res) => {
  const uploadedFiles = req.files || [];

  try {
    const payload = buildCampaignPayload(req.body);
    const mediaAssets = mapMediaAssets(uploadedFiles);
    const verification = verifyCampaign({ ...payload, mediaAssets });

    const campaign = await Campaign.create({
      owner: req.user.userId,
      ...payload,
      mediaAssets,
      verification,
      isPublic: verification.status === "approved",
      publishedAt: verification.status === "approved" ? verification.approvedAt : null,
      publicationStatus: verification.status === "approved" ? "public" : "blocked",
      status: payload.status || (verification.status === "approved" ? "active" : "rejected"),
      sentimentSummary: {
        positive: 62,
        neutral: 24,
        negative: 14,
        score: 68,
      },
      generatedInsights: [],
    });

    await ensureCampaignAnalyticsSeeded(campaign);
    const refreshedCampaign = await syncCampaignDerivedMetrics(campaign._id);

    res.status(201).json({ item: refreshedCampaign });
  } catch (error) {
    cleanupUploadedFiles(uploadedFiles);
    throw error;
  }
});

const updateCampaign = asyncHandler(async (req, res) => {
  const uploadedFiles = req.files || [];
  const campaign = await Campaign.findOne({
    _id: req.params.id,
    owner: req.user.userId,
  });

  if (!campaign) {
    cleanupUploadedFiles(uploadedFiles);
    throw new ApiError(404, "Campaign not found.");
  }

  const payload = buildCampaignPayload({ ...campaign.toObject(), ...req.body });
  const appendedAssets = [...campaign.mediaAssets, ...mapMediaAssets(uploadedFiles)];
  const verification = verifyCampaign({ ...payload, mediaAssets: appendedAssets });

  campaign.set({
    ...payload,
    mediaAssets: appendedAssets,
    verification,
    publicationStatus: verification.status === "approved" ? "public" : "blocked",
    isPublic: verification.status === "approved",
    publishedAt: verification.status === "approved" ? verification.approvedAt : null,
    status:
      req.body.status ||
      (verification.status === "approved" && campaign.status === "rejected"
        ? "active"
        : campaign.status),
  });

  await campaign.save();
  await ensureCampaignAnalyticsSeeded(campaign);
  const refreshedCampaign = await syncCampaignDerivedMetrics(campaign._id);

  res.status(200).json({ item: refreshedCampaign });
});

const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOneAndDelete({
    _id: req.params.id,
    owner: req.user.userId,
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found.");
  }

  await Promise.all([
    AnalyticsSnapshot.deleteMany({ campaign: campaign._id }),
  ]);

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

const getCampaignHealth = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({
    _id: req.params.id,
    owner: req.user.userId,
  });

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

  const campaigns = await Campaign.find({
    _id: { $in: objectIds },
    owner: req.user.userId,
  });

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
  getCampaignHealth,
  compareCampaigns,
};
