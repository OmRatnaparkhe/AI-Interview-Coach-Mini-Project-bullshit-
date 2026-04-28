import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  clerkId: String,
  email: String,
  name: String,

  onboardingCompleted: { type: Boolean, default: false },

  preferences: {
    languages: [String],
    stacks: [String],
    experienceLevel: String,
    targetRole: String,
  },

  stats: {
    totalInterviews: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);