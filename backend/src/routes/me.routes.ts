import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { createClerkClient } from "@clerk/backend";
import { ensureUser } from "../services/user.service.js";

const router = express.Router();

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  throw new Error("Missing CLERK_SECRET_KEY");
}

const clerk = createClerkClient({ secretKey });

router.get("/", requireAuth, async (req: any, res) => {
  const clerkId = req.userId as string;
  const user = await clerk.users.getUser(clerkId);
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  const dbUser = await ensureUser({
    clerkId,
    email: primaryEmail ?? null,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
  });

  res.json(dbUser);
});

export default router;

