import express from "express";
import {
  startVoice,
  uploadAnswer,
  submitVoice,
  startLiveVoiceInterview,
  processLiveResponse,
  completeLiveInterview,
} from "./voice.controller.js";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { upload } from "../../utils/multer.js";

const router = express.Router();

router.post("/start", requireAuth, startVoice);

router.post(
  "/upload",
  requireAuth,
  upload.single("audio"),
  uploadAnswer
);

router.post("/submit", requireAuth, submitVoice);

// Live Interview Routes
router.post("/live/start", requireAuth, startLiveVoiceInterview);

router.post(
  "/live/response",
  requireAuth,
  upload.single("audio"),
  processLiveResponse
);

router.post("/live/complete", requireAuth, completeLiveInterview);

export default router;