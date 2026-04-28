import type { Request, Response, NextFunction } from "express";
import { createClerkClient, verifyToken } from "@clerk/backend";

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  throw new Error(
    "Missing CLERK_SECRET_KEY environment variable. Set CLERK_SECRET_KEY in backend/.env or process env."
  );
}

const clerkClient = createClerkClient({ secretKey });

export type ClerkAuth = {
  clerkUserId: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __clerkAuthTypes: undefined;
}

export interface AuthedRequest extends Request {
  auth?: ClerkAuth;
}

export async function clerkAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { sub } = await verifyToken(token, {
      secretKey,
      // audience/issuer can be added later if needed; secretKey is sufficient for MVP
    });
    if (!sub) return res.status(401).json({ message: "Unauthorized" });
    req.auth = { clerkUserId: sub };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

