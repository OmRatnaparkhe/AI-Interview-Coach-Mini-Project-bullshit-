import User from "../models/user.model.js";

export async function ensureUser(params: {
  clerkId: string;
  email?: string | null;
  name?: string | null;
}) {
  const { clerkId, email, name } = params;

  const update: Record<string, unknown> = {};
  if (email) update.email = email;
  if (name) update.name = name;

  return await User.findOneAndUpdate(
    { clerkId },
    { $setOnInsert: { clerkId }, ...(Object.keys(update).length ? { $set: update } : {}) },
    { new: true, upsert: true }
  );
}

