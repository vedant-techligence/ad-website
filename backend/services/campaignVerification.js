const path = require("path");

const BLOCKED_TERMS = [
  "abuse", "adult", "alcohol", "betting", "bomb", "cannabis", "casino",
  "cocaine", "escort", "gambling", "gun", "hate", "kill", "lottery",
  "nude", "nudity", "porn", "racist", "scam", "sexual", "terror",
  "violence", "weapon", "xxx",
];

const WARNING_TERMS = [
  "attack", "blood", "cheat", "crash", "fake", "hack", "illegal",
  "injury", "smoke", "vape",
];

const DANGEROUS_EXTENSIONS = new Set([
  ".bat", ".cmd", ".com", ".exe", ".js", ".msi", ".ps1", ".scr", ".sh", ".vbs",
]);

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

const normalizeText = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const findFlaggedTerms = (text, terms) => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return [...new Set(terms.filter((term) => normalized.includes(term)))];
};

const verifyMediaAssets = (mediaAssets) => {
  const issues = [];

  mediaAssets.forEach((asset) => {
    const ext = path.extname(asset.originalName || "").toLowerCase();
    if (DANGEROUS_EXTENSIONS.has(ext)) {
      issues.push(`Blocked file type: ${asset.originalName}`);
    }
    if (asset.kind === "image") {
      if (!ALLOWED_IMAGE_TYPES.has(asset.mimeType))
        issues.push(`Unsupported image format: ${asset.originalName}`);
      if (asset.size > MAX_IMAGE_BYTES)
        issues.push(`Image exceeds 10 MB: ${asset.originalName}`);
    }
    if (asset.kind === "video") {
      if (!ALLOWED_VIDEO_TYPES.has(asset.mimeType))
        issues.push(`Unsupported video format: ${asset.originalName}`);
      if (asset.size > MAX_VIDEO_BYTES)
        issues.push(`Video exceeds 80 MB: ${asset.originalName}`);
    }
  });

  return issues;
};

// Runs keyword + media format pre-checks only.
// Final approve/reject decision is made by admin in the admin panel.
const verifyCampaign = ({ title, brandName, robotPlacement, destinationUrl, description, callToAction, spokenWords, slideText, mediaAssets }) => {
  const textToScan = [title, brandName, robotPlacement, destinationUrl, description, callToAction, spokenWords, slideText,
    ...mediaAssets.map((a) => a.originalName),
  ].join(" ");

  const blockedTerms = findFlaggedTerms(textToScan, BLOCKED_TERMS);
  const warningTerms = findFlaggedTerms(textToScan, WARNING_TERMS);
  const mediaIssues = verifyMediaAssets(mediaAssets);
  const flaggedTerms = [...new Set([...blockedTerms, ...warningTerms])];
  const hasBlockingIssues = blockedTerms.length > 0 || mediaIssues.length > 0;

  // Auto-reject only on hard blocked terms or bad file types
  // Otherwise always goes to pending_review for admin decision
  const autoRejected = hasBlockingIssues;

  return {
    status: autoRejected ? "rejected" : "pending_review",
    riskLevel: blockedTerms.length || mediaIssues.length ? "high" : warningTerms.length ? "medium" : "low",
    checkedAt: new Date(),
    approvedAt: null,
    flaggedTerms,
    issues: mediaIssues,
    checksSummary: autoRejected
      ? `Auto-rejected by safety checks: ${[...blockedTerms, ...mediaIssues].slice(0, 5).join("; ")}.`
      : "Passed automated pre-checks. Pending admin review.",
  };
};

module.exports = { verifyCampaign };
