import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import MCQ from "../models/mcq.model.js";
import Voice from "../models/voice.model.js";

const router = express.Router();

router.get("/summary", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;

  const [mcqCount, voiceCount] = await Promise.all([
    MCQ.countDocuments({ userId }),
    Voice.countDocuments({ userId }),
  ]);

  const [mcqScores, voiceScores] = await Promise.all([
    MCQ.find({ userId, status: "completed", score: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(30)
      .select({ score: 1, createdAt: 1 }),
    Voice.find({ userId, status: "completed", score: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(30)
      .select({ score: 1, createdAt: 1 }),
  ]);

  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

  const mcqAvg = avg(mcqScores.map((x: any) => x.score ?? 0));
  const voiceAvg = avg(voiceScores.map((x: any) => x.score ?? 0));

  res.json({
    totals: {
      mcq: mcqCount,
      voice: voiceCount,
      all: mcqCount + voiceCount,
    },
    averages: {
      mcq: Math.round(mcqAvg),
      voice: Math.round(voiceAvg),
    },
    recentScores: {
      mcq: mcqScores.map((x: any) => ({ score: x.score, createdAt: x.createdAt })),
      voice: voiceScores.map((x: any) => ({ score: x.score, createdAt: x.createdAt })),
    },
  });
});

export default router;

