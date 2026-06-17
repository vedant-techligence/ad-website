import { Campaign } from "../models/campaign.model.js";
import { uploadVideoToCloudinary } from "../config/cloudinary.js";
import mongoose from "mongoose";
/**
 * POST /api/campaigns
 * Creates a campaign in "draft" status after uploading the video to Cloudinary.
 * Expects multipart/form-data: video file + text fields.
 */


export const createCampaignDraft = async (req, res) => {
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
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required.",
      });
    }

    // upload to Cloudinary
    console.log("File received:", req.file);
    const cloudinaryResponse = await uploadVideoToCloudinary(req.file.path);
    console.log("Cloudinary response:", cloudinaryResponse);

    if (!cloudinaryResponse) {
      return res.status(500).json({
        success: false,
        message: "Video upload to Cloudinary failed.",
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
      // advertiser: req.user._id, // assumes auth middleware

      advertiser: new mongoose.Types.ObjectId(),
      title,
      description,
      videoUrl: cloudinaryResponse.secure_url,
      videoPublicId: cloudinaryResponse.public_id,
      thumbnailUrl: cloudinaryResponse.eager?.[0]?.secure_url || "",
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
    const campaigns = await Campaign.find({ advertiser: req.user._id })
      .sort({ createdAt: -1 })
      .select("-videoPublicId"); // no need to leak Cloudinary internal id to frontend

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
      advertiser: req.user._id, // ensures users can't fetch someone else's campaign
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
