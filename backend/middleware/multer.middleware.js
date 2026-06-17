import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// temp local storage before pushing to Cloudinary
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || "");
    const safeBaseName = path
      .basename(file.originalname || "asset", extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 60);
    cb(
      null,
      `${Date.now()}-${safeBaseName}-${crypto.randomUUID()}${extension.toLowerCase()}`,
    );
  },
});

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_MIME_TYPES = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only MP4/MOV/WEBM videos and JPG/PNG/WEBP images are allowed.",
      ),
      false,
    );
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB per file — covers video; images will be far smaller in practice
    files: 6, // 1 video + up to 5 banner images, adjust as needed
  },
});

// Accepts a mixed field: up to 6 files total under the "mediaFiles" form field name.
// Frontend should append all files (video + images) under this same field name.
export const uploadCampaignMedia = multerUpload.array("mediaFiles", 6);

// Helper so the controller can tell video apart from image after upload
export const classifyFileKind = (mimetype) => {
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) return "video";
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return "image";
  return null;
};

// Cleanup helper — used if DB save fails after files are already on disk/Cloudinary
export const cleanupLocalFiles = (files = []) => {
  files.forEach((file) => {
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};
