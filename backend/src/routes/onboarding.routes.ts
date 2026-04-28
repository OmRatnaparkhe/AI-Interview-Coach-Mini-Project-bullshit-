import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

router.put("/", requireAuth, async (req: any, res) => {
  const clerkId = req.userId as string;
  const { stacks, languages, experienceLevel, targetRole } = req.body ?? {};

  const updated = await User.findOneAndUpdate(
    { clerkId },
    {
      $set: {
        onboardingCompleted: true,
        preferences: {
          stacks: Array.isArray(stacks) ? stacks : [],
          languages: Array.isArray(languages) ? languages : [],
          experienceLevel: typeof experienceLevel === "string" ? experienceLevel : "",
          targetRole: typeof targetRole === "string" ? targetRole : "",
        },
      },
    },
    { new: true, upsert: true }
  );

  res.json(updated);
});

export default router;

