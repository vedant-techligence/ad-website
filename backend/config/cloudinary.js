import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file (saved temporarily by Multer) to Cloudinary —
 * works for both images and videos, since campaigns can now have both.
 * Deletes the local temp file regardless of success/failure.
 *
 * @param {string} localFilePath - path to the temp file Multer saved
 * @param {"video"|"image"} kind - which resource type to upload as
 */
export const uploadMediaToCloudinary = async (localFilePath, kind) => {
  try {
    if (!localFilePath) return null;

    const isVideo = kind === "video";

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: isVideo ? "video" : "image",
      folder: "ad_campaigns",
      // only generate a thumbnail for videos
      ...(isVideo && {
        eager: [{ width: 400, height: 225, crop: "fill", format: "jpg" }],
      }),
    });

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

export default cloudinary;
