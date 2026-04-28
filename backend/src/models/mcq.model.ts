import mongoose from "mongoose";

const mcqSchema = new mongoose.Schema({
  // External auth identifier (e.g. Clerk user id) rather than a Mongo ObjectId
  userId: { type: String, required: true, index: true },

  tech: String,
  difficulty: String,

  questions: [
    {
      question: String,
      options: [String],
      correctAnswer: String,
    }
  ],

  userAnswers: [String],

  score: Number,
  feedback: Object,

  status: {
    type: String,
    enum: ["in-progress", "completed"],
    default: "in-progress"
  }

}, { timestamps: true });

export default mongoose.model("MCQInterview", mcqSchema);