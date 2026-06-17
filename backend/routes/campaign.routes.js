import { Router } from "express";
import { uploadVideo } from "../middleware/multer.middleware.js";
import {
  createCampaignDraft,
  getMyCampaigns,
  getCampaignById,
} from "../controllers/campaign.controller.js";
// import { verifyJWT } from "../middleware/auth.middleware.js"; //  auth middleware

const router = Router();

// router.use(verifyJWT); //  — protects all routes below

router.post("/", uploadVideo.single("video"), createCampaignDraft);
router.get("/my", getMyCampaigns);
router.get("/:id", getCampaignById);

export default router;
