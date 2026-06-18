const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

/**
 * Extracts the Google Drive file ID from common share-link formats:
 *  - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *  - https://drive.google.com/open?id=FILE_ID
 *  - https://drive.google.com/uc?id=FILE_ID&export=download
 */
const extractDriveFileId = (url) => {
  if (!url || typeof url !== "string") return null;

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/FILE_ID/...
    /[?&]id=([a-zA-Z0-9_-]+)/, // ?id=FILE_ID or &id=FILE_ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
};

const buildDriveDownloadUrl = (fileId) =>
  `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;

const ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"];
const MAX_DRIVE_FILE_SIZE = 200 * 1024 * 1024; // 200MB, mirrors multer's video limit

/**
 * Downloads a file from a direct URL to a local temp path.
 * Follows one redirect (Drive's download endpoint redirects once for most files).
 * Rejects files that exceed MAX_DRIVE_FILE_SIZE or aren't recognizable video content.
 */
const downloadFileFromUrl = (url, destDir) => {
  return new Promise((resolve, reject) => {
    const tempFilename = `${Date.now()}-drive-${crypto.randomUUID()}.mp4`;
    const destPath = path.join(destDir, tempFilename);
    const fileStream = fs.createWriteStream(destPath);

    let totalBytes = 0;

    const request = (requestUrl, redirectsLeft = 3, cookieHeader = "") => {
      const requestOptions = {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      };

      https
        .get(requestUrl, requestOptions, (response) => {
          console.log("DRIVE FETCH DEBUG:", {
            url: requestUrl,
            statusCode: response.statusCode,
            location: response.headers.location,
            contentType: response.headers["content-type"],
            setCookie: response.headers["set-cookie"],
            redirectsLeft,
          });

          // carry forward any cookies Drive sets on this hop to the next request
          const newCookies = response.headers["set-cookie"];
          const nextCookieHeader = newCookies
            ? newCookies.map((c) => c.split(";")[0]).join("; ")
            : cookieHeader;

          // follow redirects (Drive often redirects through usercontent.google.com)
          if (
            [301, 302, 303, 307, 308].includes(response.statusCode) &&
            response.headers.location &&
            redirectsLeft > 0
          ) {
            response.resume(); // drain this response
            return request(
              response.headers.location,
              redirectsLeft - 1,
              nextCookieHeader,
            );
          }

          if (response.statusCode !== 200) {
            fileStream.close();
            fs.unlink(destPath, () => {});
            return reject(
              new Error(
                `Failed to fetch file from Drive (status ${response.statusCode}).`,
              ),
            );
          }

          const contentType = response.headers["content-type"] || "";

          // Drive sometimes returns an HTML "virus scan warning" page instead of
          // the file for large files — detect that early instead of saving garbage.
          if (contentType.includes("text/html")) {
            fileStream.close();
            fs.unlink(destPath, () => {});
            return reject(
              new Error(
                "Could not download the file directly. Make sure sharing is set to 'Anyone with the link', and that the file is small enough to skip Drive's virus-scan confirmation page.",
              ),
            );
          }

          response.on("data", (chunk) => {
            totalBytes += chunk.length;
            if (totalBytes > MAX_DRIVE_FILE_SIZE) {
              response.destroy();
              fileStream.close();
              fs.unlink(destPath, () => {});
              reject(new Error("File exceeds the 200MB size limit."));
            }
          });

          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close();
            resolve({ path: destPath, size: totalBytes, contentType });
          });
        })
        .on("error", (err) => {
          fileStream.close();
          fs.unlink(destPath, () => {});
          reject(err);
        });
    };

    request(url, 5);
  });
};

module.exports = {
  extractDriveFileId,
  buildDriveDownloadUrl,
  downloadFileFromUrl,
  ALLOWED_VIDEO_EXTENSIONS,
  MAX_DRIVE_FILE_SIZE,
};
