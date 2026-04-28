import type { Response, NextFunction } from "express";
import { clerkAuth, type AuthedRequest } from "./clerkAuth.middleware.js";

/**
 * Production auth: Clerk session token (Authorization: Bearer <token>).
 * Dev fallback: allow `x-user-id` when DEV_AUTH_BYPASS=true.
 */
export async function requireAuth(
  req: AuthedRequest & { userId?: string },
  res: Response,
  next: NextFunction
) {
  const devBypass = process.env.DEV_AUTH_BYPASS === "true";

  if (devBypass) {
    const userIdHeader = req.headers["x-user-id"];
    if (typeof userIdHeader === "string" && userIdHeader.trim()) {
      req.userId = userIdHeader.trim();
      req.auth = { clerkUserId: req.userId };
      return next();
    }
  }

  await clerkAuth(req, res, () => {
    if (!req.auth?.clerkUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.userId = req.auth.clerkUserId;
    next();
  });
}