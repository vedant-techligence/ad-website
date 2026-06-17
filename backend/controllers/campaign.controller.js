import { Campaign } from "../models/Campaign.model.js";
import { uploadMediaToCloudinary } from "../config/cloudinary.js";
import {
  classifyFileKind,
  cleanupLocalFiles,
} from "../middleware/multer.middleware.js";

/**
 * POST /api/campaigns
 * Creates a campaign in "draft" status after uploading all media files to Cloudinary.
 * Expects multipart/form-data: 1+ files under "mediaFiles" (at least one video) + text fields.
 */
export const createCampaignDraft = async (req, res) => {
  const files = req.files || [];

  try {
    const {
      title,
      description,
      targetUrl,
      locations, // comma-separated string e.g. "India,Maharashtra" OR array
      ageMin,
      ageMax,
      gender,
      interests, // comma-separated string OR array
      startDate,
      endDate,
      repeatRate,
      dailyBudgetCap,
    } = req.body;

    // basic required-field check
    if (
      !title ||
      !targetUrl ||
      !startDate ||
      !endDate ||
      !repeatRate ||
      !dailyBudgetCap
    ) {
      cleanupLocalFiles(files);
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one media file (video) is required.",
      });
    }

    // upload every file to Cloudinary, tagging each with its kind (video/image)
    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const kind = classifyFileKind(file.mimetype);
        const cloudinaryResponse = await uploadMediaToCloudinary(
          file.path,
          kind,
        );
        return { file, kind, cloudinaryResponse };
      }),
    );

    // if any single upload failed, bail out and clean up whatever succeeded
    const failed = uploadResults.find((r) => !r.cloudinaryResponse);
    if (failed) {
      cleanupLocalFiles(files);
      return res.status(500).json({
        success: false,
        message: "One or more files failed to upload to Cloudinary.",
      });
    }

    const mediaAssets = uploadResults.map(
      ({ file, kind, cloudinaryResponse }) => ({
        kind,
        url: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id,
        thumbnailUrl:
          kind === "video"
            ? cloudinaryResponse.eager?.[0]?.secure_url || ""
            : undefined,
        originalName: file.originalname,
      }),
    );

    // require at least one video among the uploaded assets — mirrors the schema-level check
    if (!mediaAssets.some((a) => a.kind === "video")) {
      return res.status(400).json({
        success: false,
        message: "At least one video file is required per campaign.",
      });
    }

    // normalize array-ish fields whether they arrive as CSV string or actual array
    const toArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const campaign = await Campaign.create({
      advertiser: req.user._id, // TODO: confirm with auth teammate — may need to be req.user.userId instead
      title,
      description,
      mediaAssets,
      targetUrl,
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
      status: "draft",
    });

    return res.status(201).json({
      success: true,
      message: "Campaign draft created successfully.",
      data: campaign,
    });
  } catch (error) {
    cleanupLocalFiles(files);
    console.error("createCampaignDraft error:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "Something went wrong while creating the campaign.",
    });
  }
};

/**
 * GET /api/campaigns/my
 * Returns all campaigns belonging to the logged-in advertiser,
 * for the "My Campaigns" status view.
 */
export const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ advertiser: req.user._id }) // TODO: confirm field name with auth teammate
      .sort({ createdAt: -1 })
      .select("-mediaAssets.publicId"); // no need to leak Cloudinary internal id to frontend

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    console.error("getMyCampaigns error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns.",
    });
  }
};

/**
 * GET /api/campaigns/:id
 * Single campaign detail — used on the review/payment step.
 */
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      advertiser: req.user._id, // TODO: confirm field name with auth teammate
    });

    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found." });
    }

    return res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    console.error("getCampaignById error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch campaign." });
  }
};

/**
 * GET /api/campaigns/public
 * Returns only campaigns that are live/active — for whatever surface
 * displays approved ads to end viewers (e.g. the robots/display screens).
 * No auth required since this is public-facing.
 */
export const getPublicCampaigns = async (_req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "active" })
      .sort({ updatedAt: -1 })
      .select("-advertiser -mediaAssets.publicId");

    return res
      .status(200)
      .json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    console.error("getPublicCampaigns error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load public campaigns." });
  }
};
