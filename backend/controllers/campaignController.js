const mongoose = require("mongoose");
const path = require("path");

const Campaign = require("../models/Campaign.model");
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
  startDate: body.startDate || body?.schedule?.startDate || null,
  endDate: body.endDate || body?.schedule?.endDate || null,
  dailyBudgetCap: Number(body.dailyBudgetCap || 0),
  repeatRate: Number(body.repeatRate || 3),
  estimatedCost: Number(body.estimatedCost || 0),
  placement: body.placement || "other",
  timing: body.timing || "standard",
  audience: body.audience || "all",
  targeting: {
    locations: String(body.locations || body.city || "")
      .split(",").map((e) => e.trim()).filter(Boolean),
    ageRange: {
      min: Number(body.ageMin || 18),
      max: Number(body.ageMax || 65),
    },
    interests: String(body.interests || "")
      .split(",").map((e) => e.trim()).filter(Boolean),
    gender: body.gender || "all",
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
    const pdfFile = uploadedFiles.find((f) => f.mimetype === "application/pdf");
    const mediaFiles = uploadedFiles.filter((f) => f.mimetype !== "application/pdf");
    const mediaAssets = mapMediaAssets(mediaFiles);
    const verification = verifyCampaign({ ...payload, mediaAssets });

    const contextPdf = pdfFile ? {
      originalName: pdfFile.originalname,
      storedName: pdfFile.filename,
      publicUrl: `/uploads/campaigns/${pdfFile.filename}`,
    } : null;

    const { calculateCampaignEstimate } = require("../utils/campaignPricing");
    const estimate = await calculateCampaignEstimate({
      startDate: payload.startDate,
      endDate: payload.endDate,
      repeatRate: payload.repeatRate,
      dailyBudgetCap: payload.dailyBudgetCap,
      placement: payload.placement,
      timing: payload.timing,
      audience: payload.audience,
    });

    const campaign = await Campaign.create({
      owner: req.user.userId,
      ...payload,
      mediaAssets,
      contextPdf,
      estimatedCost: estimate.breakdown.estimatedCost,
      verification,
      status: verification.status === "rejected" ? "rejected" : "pending_review",
      isPublic: false,
      publishedAt: null,
      sentimentSummary: { positive: 0, neutral: 0, negative: 0, score: 0 },
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
    status: verification.status === "rejected" ? "rejected" : "pending_review",
    isPublic: false,
    publishedAt: null,
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

const getCampaignReport = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.user.userId });
  if (!campaign) throw new ApiError(404, "Campaign not found.");

  const snapshots = await AnalyticsSnapshot.find({ campaign: campaign._id })
    .sort({ date: -1 }).limit(30);

  const totals = snapshots.reduce(
    (acc, s) => { acc.impressions += s.impressions; acc.clicks += s.clicks; acc.conversions += s.conversions; acc.spend += s.spend; acc.revenue += s.revenue; return acc; },
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 },
  );
  const ctr = totals.impressions ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0;
  const cvr = totals.clicks ? Number(((totals.conversions / totals.clicks) * 100).toFixed(2)) : 0;
  const roas = totals.spend ? Number((totals.revenue / totals.spend).toFixed(2)) : 0;

  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="report-${campaign._id}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).fillColor("#00a8cc").text("Campaign Report", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor("#000").text(campaign.title, { align: "center" });
  doc.fontSize(10).fillColor("#666").text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, { align: "center" });
  doc.moveDown(1);

  // Campaign Info
  doc.fontSize(13).fillColor("#00a8cc").text("Campaign Details");
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#00a8cc").stroke();
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#000");
  doc.text(`Brand: ${campaign.brandName}`);
  doc.text(`Placement: ${campaign.robotPlacement}`);
  doc.text(`Status: ${campaign.status}`);
  doc.text(`Start: ${campaign.startDate ? new Date(campaign.startDate).toLocaleDateString("en-IN") : "—"}`);
  doc.text(`End: ${campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("en-IN") : "—"}`);
  doc.text(`Daily Budget Cap: ₹${campaign.dailyBudgetCap?.toLocaleString("en-IN") || 0}`);
  doc.text(`Estimated Cost: ₹${campaign.estimatedCost?.toLocaleString("en-IN") || 0}`);
  doc.moveDown(1);

  // Analytics
  doc.fontSize(13).fillColor("#00a8cc").text("Analytics Summary");
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#00a8cc").stroke();
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#000");
  doc.text(`Impressions: ${totals.impressions.toLocaleString("en-IN")}`);
  doc.text(`Clicks: ${totals.clicks.toLocaleString("en-IN")}`);
  doc.text(`Conversions: ${totals.conversions.toLocaleString("en-IN")}`);
  doc.text(`CTR: ${ctr}%`);
  doc.text(`CVR: ${cvr}%`);
  doc.text(`Spend: ₹${totals.spend.toFixed(2)}`);
  doc.text(`Revenue: ₹${totals.revenue.toFixed(2)}`);
  doc.text(`ROAS: ${roas}x`);
  doc.text(`Health Score: ${campaign.healthScore}`);
  doc.moveDown(1);

  // Sentiment
  if (campaign.sentimentSummary) {
    doc.fontSize(13).fillColor("#00a8cc").text("Sentiment");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#00a8cc").stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#000");
    doc.text(`Positive: ${campaign.sentimentSummary.positive}`);
    doc.text(`Neutral: ${campaign.sentimentSummary.neutral}`);
    doc.text(`Negative: ${campaign.sentimentSummary.negative}`);
    doc.text(`Score: ${campaign.sentimentSummary.score}`);
    doc.moveDown(1);
  }

  // Insights
  if (campaign.generatedInsights?.length) {
    doc.fontSize(13).fillColor("#00a8cc").text("Insights");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#00a8cc").stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#000");
    campaign.generatedInsights.forEach((insight) => doc.text(`• ${insight}`));
  }

  doc.end();
});

const emailCampaignReport = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.user.userId });
  if (!campaign) throw new ApiError(404, "Campaign not found.");

  const User = require("../models/User");
  const user = await User.findById(req.user.userId).select("email name");
  if (!user) throw new ApiError(404, "User not found.");

  const snapshots = await AnalyticsSnapshot.find({ campaign: campaign._id })
    .sort({ date: -1 }).limit(30);

  const totals = snapshots.reduce(
    (acc, s) => { acc.impressions += s.impressions; acc.clicks += s.clicks; acc.conversions += s.conversions; acc.spend += s.spend; acc.revenue += s.revenue; return acc; },
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 },
  );

  // Build PDF in memory
  const PDFDocument = require("pdfkit");
  const nodemailer = require("nodemailer");

  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  await new Promise((resolve) => {
    doc.on("end", resolve);
    doc.fontSize(20).fillColor("#00a8cc").text("Campaign Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor("#000").text(campaign.title, { align: "center" });
    doc.fontSize(10).fillColor("#666").text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, { align: "center" });
    doc.moveDown(1);
    doc.fontSize(13).fillColor("#00a8cc").text("Campaign Details");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#00a8cc").stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#000");
    doc.text(`Brand: ${campaign.brandName}`);
    doc.text(`Placement: ${campaign.robotPlacement}`);
    doc.text(`Status: ${campaign.status}`);
    doc.text(`Daily Budget Cap: ₹${campaign.dailyBudgetCap?.toLocaleString("en-IN") || 0}`);
    doc.text(`Estimated Cost: ₹${campaign.estimatedCost?.toLocaleString("en-IN") || 0}`);
    doc.moveDown(1);
    doc.fontSize(13).fillColor("#00a8cc").text("Analytics Summary");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#00a8cc").stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#000");
    doc.text(`Impressions: ${totals.impressions.toLocaleString("en-IN")}`);
    doc.text(`Clicks: ${totals.clicks.toLocaleString("en-IN")}`);
    doc.text(`Conversions: ${totals.conversions.toLocaleString("en-IN")}`);
    doc.text(`Spend: ₹${totals.spend.toFixed(2)}`);
    doc.text(`Revenue: ₹${totals.revenue.toFixed(2)}`);
    doc.text(`Health Score: ${campaign.healthScore}`);
    if (campaign.generatedInsights?.length) {
      doc.moveDown(1);
      doc.fontSize(13).fillColor("#00a8cc").text("Insights");
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#00a8cc").stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor("#000");
      campaign.generatedInsights.forEach((insight) => doc.text(`• ${insight}`));
    }
    doc.end();
  });

  const pdfBuffer = Buffer.concat(chunks);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: `"Techligence Ads" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Campaign Report — ${campaign.title}`,
    html: `<p>Hi ${user.name},</p><p>Please find your campaign report for <strong>${campaign.title}</strong> attached.</p><p>— Techligence Ads</p>`,
    attachments: [{ filename: `report-${campaign._id}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
  });

  res.status(200).json({ message: `Report sent to ${user.email}` });
});

const estimateCampaignCost = asyncHandler(async (req, res) => {
  const { startDate, endDate, repeatRate, dailyBudgetCap, placement, timing, audience } = req.body;
  const { calculateCampaignEstimate } = require("../utils/campaignPricing");
  const estimate = await calculateCampaignEstimate({ startDate, endDate, repeatRate, dailyBudgetCap, placement, timing, audience });
  res.status(200).json(estimate);
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
  getCampaignReport,
  emailCampaignReport,
  estimateCampaignCost,
};
