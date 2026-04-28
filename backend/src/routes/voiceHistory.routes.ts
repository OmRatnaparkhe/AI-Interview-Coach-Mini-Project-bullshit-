import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import Voice from "../models/voice.model.js";

const router = express.Router();

router.get("/history", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : null;

  const query: any = { userId };
  if (cursor) query._id = { $lt: cursor };

  const items = await Voice.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .select({ audioAnswers: 0 });

  const last = items[items.length - 1];
  const nextCursor = last ? String(last._id) : null;
  res.json({ items, nextCursor });
});

router.get("/:id", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  const item = await Voice.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  if (item.userId !== userId) return res.status(403).json({ message: "Forbidden" });
  res.json(item);
});

export default router;

