import express from "express";
import { startMCQ, submitMCQ } from "./mcq.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/start", requireAuth, startMCQ);
router.post("/submit", requireAuth, submitMCQ);

export default router;