const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { uploadCampaignMedia } = require("../middleware/uploadCampaignMedia");
const { validate } = require("../middleware/validate");
const {
  campaignCreateValidation,
  campaignUpdateValidation,
  importDriveValidation,
} = require("../validations/campaignValidation");
const {
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
} = require("../controllers/campaignController");

const router = express.Router();

router.get("/public", getPublicCampaigns);
router.get("/compare", authMiddleware, compareCampaigns);
router.post("/import-drive-video", authMiddleware, importDriveValidation, validate, importDriveVideo);
router.get("/", authMiddleware, listCampaigns);
router.post("/", authMiddleware, uploadCampaignMedia, campaignCreateValidation, validate, createCampaign);
router.post("/:id/estimate", authMiddleware, estimateCampaign);
router.get("/:id/health", authMiddleware, getCampaignHealth);
router.get("/:id", authMiddleware, getCampaign);
router.patch("/:id", authMiddleware, uploadCampaignMedia, campaignUpdateValidation, validate, updateCampaign);
router.delete("/:id", authMiddleware, deleteCampaign);

module.exports = router;
