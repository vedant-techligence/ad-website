const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { uploadCampaignMedia } = require("../middleware/uploadCampaignMedia");
const { validate } = require("../middleware/validate");
const {
  campaignCreateValidation,
  campaignUpdateValidation,
} = require("../validations/campaignValidation");
const {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getPublicCampaigns,
  getCampaignHealth,
  compareCampaigns,
} = require("../controllers/campaignController");

const router = express.Router();

router.get("/public", getPublicCampaigns);
router.get("/compare", authMiddleware, compareCampaigns);
router.get("/", authMiddleware, listCampaigns);
router.get("/:id/health", authMiddleware, getCampaignHealth);
router.get("/:id", authMiddleware, getCampaign);
router.post("/", authMiddleware, uploadCampaignMedia, campaignCreateValidation, validate, createCampaign);
router.patch("/:id", authMiddleware, uploadCampaignMedia, campaignUpdateValidation, validate, updateCampaign);
router.delete("/:id", authMiddleware, deleteCampaign);

module.exports = router;
