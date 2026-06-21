const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  mockRekognition,
  mockTranscribe,
  mockComprehend,
  mockWhisper,
  mockVideoModeration,
} = require("../controllers/integrationController");

const router = express.Router();

router.post("/rekognition/analyze", authMiddleware, mockRekognition);
router.post("/transcribe", authMiddleware, mockTranscribe);
router.post("/comprehend/sentiment", authMiddleware, mockComprehend);
router.post("/whisper/transcribe", authMiddleware, mockWhisper);
router.post("/video-moderation", authMiddleware, mockVideoModeration);

module.exports = router;
