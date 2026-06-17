const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const Campaign = require("../models/Campaign");
const { authMiddleware } = require("../middleware/auth");
const { verifyCampaign } = require("../services/campaignVerification");

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
    cb(null, `${Date.now()}-${safeBaseName}-${crypto.randomUUID()}${extension.toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 6,
    fileSize: 80 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
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

const sanitizeText = (value) => String(value || "").replace(/<[^>]*>/g, "").trim();

const mapMediaAssets = (files = []) =>
  files.map((file) => {
    const relativePath = path.relative(uploadsRoot, file.path).split(path.sep).join("/");

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
    const campaigns = await Campaign.find({ owner: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Failed to load campaigns." });
  }
});

router.post("/", authMiddleware, uploadCampaignFiles, async (req, res) => {
  const files = req.files || [];

  try {
    const payload = {
      title: sanitizeText(req.body.title),
      brandName: sanitizeText(req.body.brandName),
      robotPlacement: sanitizeText(req.body.robotPlacement),
      destinationUrl: sanitizeText(req.body.destinationUrl),
      description: sanitizeText(req.body.description),
      callToAction: sanitizeText(req.body.callToAction),
      spokenWords: sanitizeText(req.body.spokenWords),
      slideText: sanitizeText(req.body.slideText),
    };
    const mediaAssets = mapMediaAssets(files);
    const verification = verifyCampaign({ ...payload, mediaAssets });

    const campaign = await Campaign.create({
      owner: req.user.userId,
      ...payload,
      mediaAssets,
      verification,
      status: verification.status === "approved" ? "public" : "rejected",
      isPublic: verification.status === "approved",
      publishedAt: verification.status === "approved" ? verification.approvedAt : null,
    });

    res.status(201).json(campaign);
  } catch (error) {
    cleanupUploadedFiles(files);

    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Please complete all required campaign fields." });
      return;
    }

    res.status(500).json({ message: "Failed to create campaign." });
  }
});

module.exports = router;
