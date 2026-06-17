import multer from "multer";
import fs from "fs";
import path from "path";

// temp local storage before pushing to Cloudinary
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"]; // mp4, mov, webm

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only MP4, MOV, and WEBM videos are allowed.",
      ),
      false,
    );
  }
};

export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB hard limit — adjust as needed
  },
});
