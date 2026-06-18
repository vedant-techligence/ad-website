const path = require("path");
const fs = require("fs");

const BLOCKED_TERMS = [
  "abuse",
  "adult",
  "alcohol",
  "betting",
  "bomb",
  "cannabis",
  "casino",
  "cocaine",
  "escort",
  "gambling",
  "gun",
  "hate",
  "kill",
  "lottery",
  "nude",
  "nudity",
  "porn",
  "racist",
  "scam",
  "sexual",
  "terror",
  "violence",
  "weapon",
  "xxx",
];

const WARNING_TERMS = [
  "attack",
  "blood",
  "cheat",
  "crash",
  "fake",
  "hack",
  "illegal",
  "injury",
  "smoke",
  "vape",
];

const DANGEROUS_EXTENSIONS = new Set([
  ".bat",
  ".cmd",
  ".com",
  ".exe",
  ".js",
  ".msi",
  ".ps1",
  ".scr",
  ".sh",
  ".vbs",
]);

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
const uploadsRoot = path.join(__dirname, "..", "uploads");

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const findFlaggedTerms = (text, terms) => {
  const normalized = normalizeText(text);

  if (!normalized) {
    return [];
  }

  return [...new Set(terms.filter((term) => normalized.includes(term)))];
};

const verifyMediaAssets = (mediaAssets) => {
  const issues = [];

  if (!mediaAssets.length) {
    issues.push("At least one image or video must be uploaded.");
    return issues;
  }

  mediaAssets.forEach((asset) => {
    const extension = path.extname(asset.originalName || "").toLowerCase();

    if (DANGEROUS_EXTENSIONS.has(extension)) {
      issues.push(`Blocked file type detected: ${asset.originalName}`);
    }

    if (asset.kind === "image") {
      if (!ALLOWED_IMAGE_TYPES.has(asset.mimeType)) {
        issues.push(`Unsupported image format: ${asset.originalName}`);
      }
      if (asset.size > MAX_IMAGE_BYTES) {
        issues.push(`Image exceeds 10 MB limit: ${asset.originalName}`);
      }
    }

    if (asset.kind === "video") {
      if (!ALLOWED_VIDEO_TYPES.has(asset.mimeType)) {
        issues.push(`Unsupported video format: ${asset.originalName}`);
      }
      if (asset.size > MAX_VIDEO_BYTES) {
        issues.push(`Video exceeds 80 MB limit: ${asset.originalName}`);
      }
    }
  });

  return issues;
};

const buildChecksSummary = (status, flaggedTerms, issues) => {
  if (status === "approved") {
    return "Campaign text, transcript, slide notes, and uploaded media metadata passed the automated safety policy checks.";
  }

  const reasons = [...flaggedTerms, ...issues].slice(0, 5);
  return `Campaign blocked by automated safety checks: ${reasons.join("; ")}.`;
};

const verifyCampaign = ({
  title,
  brandName,
  robotPlacement,
  destinationUrl,
  description,
  callToAction,
  spokenWords,
  slideText,
  mediaAssets,
}) => {
  const textToScan = [
    title,
    brandName,
    robotPlacement,
    destinationUrl,
    description,
    callToAction,
    spokenWords,
    slideText,
    ...mediaAssets.map((asset) => asset.originalName),
  ].join(" ");

  const blockedTerms = findFlaggedTerms(textToScan, BLOCKED_TERMS);
  const warningTerms = findFlaggedTerms(textToScan, WARNING_TERMS);
  const mediaIssues = verifyMediaAssets(mediaAssets);
  const issues = [...mediaIssues];

  if (!spokenWords.trim()) {
    issues.push("Provide the spoken words or transcript used in the video for verification.");
  }

  if (!slideText.trim()) {
    issues.push("Provide the on-screen slide or visual text for verification.");
  }

  const flaggedTerms = [...new Set([...blockedTerms, ...warningTerms])];
  const rejected = flaggedTerms.length > 0 || issues.length > 0;
  const status = rejected ? "rejected" : "approved";

  return {
    status,
    riskLevel: blockedTerms.length || mediaIssues.length ? "high" : rejected ? "medium" : "low",
    checkedAt: new Date(),
    approvedAt: status === "approved" ? new Date() : null,
    flaggedTerms,
    issues,
    checksSummary: buildChecksSummary(status, flaggedTerms, issues),
  };
};

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
      absolutePath: file.path,
      publicUrl: `/uploads/${relativePath}`,
    };
  });

const cleanupUploadedFiles = (files = []) => {
  files.forEach((file) => {
    const candidatePath = file?.path || file?.absolutePath;
    if (candidatePath && fs.existsSync(candidatePath)) {
      fs.unlinkSync(candidatePath);
    }
  });
};

module.exports = { verifyCampaign, mapMediaAssets, cleanupUploadedFiles };
