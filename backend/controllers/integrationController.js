const { asyncHandler } = require("../utils/asyncHandler");

const buildMockResponse = (service, reqBody, extra = {}) => ({
  service,
  mode: "mock",
  status: "future-integration",
  receivedAt: new Date().toISOString(),
  requestEcho: reqBody,
  ...extra,
});

const mockRekognition = asyncHandler(async (req, res) => {
  res.status(200).json(
    buildMockResponse("aws-rekognition", req.body, {
      labels: ["Robot", "Display", "Crowd"],
      moderationFlags: [],
      confidence: 0.94,
    }),
  );
});

const mockTranscribe = asyncHandler(async (req, res) => {
  res.status(200).json(
    buildMockResponse("aws-transcribe", req.body, {
      transcript: "Mock transcript generated for queued robot ad audio.",
      languageCode: "en-US",
      speakerCount: 1,
    }),
  );
});

const mockComprehend = asyncHandler(async (req, res) => {
  res.status(200).json(
    buildMockResponse("aws-comprehend", req.body, {
      sentiment: "POSITIVE",
      sentimentScore: {
        positive: 0.77,
        neutral: 0.15,
        negative: 0.08,
        mixed: 0,
      },
    }),
  );
});

const mockWhisper = asyncHandler(async (req, res) => {
  res.status(200).json(
    buildMockResponse("openai-whisper", req.body, {
      transcript: "Mock whisper transcript for future audio moderation workflows.",
      segments: [
        { start: 0, end: 4.2, text: "Mock whisper transcript for future audio moderation workflows." },
      ],
    }),
  );
});

const mockVideoModeration = asyncHandler(async (req, res) => {
  res.status(200).json(
    buildMockResponse("video-moderation", req.body, {
      safeForDisplay: true,
      flaggedScenes: [],
      moderationSummary: "No unsafe visual patterns detected in mock analysis.",
    }),
  );
});

module.exports = {
  mockRekognition,
  mockTranscribe,
  mockComprehend,
  mockWhisper,
  mockVideoModeration,
};
