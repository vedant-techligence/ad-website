const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsRoot = path.join(__dirname, "..", "uploads");
const campaignsUploadRoot = path.join(uploadsRoot, "campaigns");
fs.mkdirSync(campaignsUploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, campaignsUploadRoot),
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

const uploadCampaignMedia = (req, res, next) => {
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

module.exports = { uploadCampaignMedia };
