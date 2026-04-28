import mongoose from "mongoose";

const voiceSchema = new mongoose.Schema({
  // External auth identifier (e.g. Clerk user id) rather than a Mongo ObjectId
  userId: { type: String, required: true, index: true },

  tech: String,
  difficulty: String,

  // For traditional interview mode
  questions: [String],
  audioAnswers: [String],
  transcriptions: [String],

  // For live interview mode
  interviewType: {
    type: String,
    enum: ["traditional", "live"],
    default: "traditional"
  },
  interviewId: String, // AI-generated interview ID
  conversation: [{
    type: { type: String, enum: ["interviewer", "candidate"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  currentQuestion: { type: Number, default: 1 },
  totalQuestions: { type: Number, default: 5 },

  score: Number,
  feedback: Object,

  status: {
    type: String,
    enum: ["in-progress", "active", "completed"],
    default: "in-progress"
  }

}, { timestamps: true });

export default mongoose.model("VoiceInterview", voiceSchema);