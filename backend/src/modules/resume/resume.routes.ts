import express from "express";
import { analyzeResumeController } from "./resume.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { uploadDocument } from "../../utils/multer.js";

const router = express.Router();

router.post(
  "/analyze",
  requireAuth,
  uploadDocument.single("resume"),
  analyzeResumeController
);

export default router;
