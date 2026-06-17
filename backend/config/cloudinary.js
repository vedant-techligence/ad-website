import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
console.log("Cloud:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("Key:", process.env.CLOUDINARY_API_KEY);
console.log("Secret:", process.env.CLOUDINARY_API_SECRET);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file (saved temporarily by Multer) to Cloudinary as a video,
 * then deletes the local temp file regardless of success/failure.
 */
export const uploadVideoToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "video",
      folder: "ad_campaigns",
      // generates a jpg thumbnail at the 1s mark automatically
      eager: [{ width: 400, height: 225, crop: "fill", format: "jpg" }],
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
