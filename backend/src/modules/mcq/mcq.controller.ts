import MCQ from "../../models/mcq.model.js";
import { generateMCQs, evaluateMCQ } from "./mcq.service.js";

export const startMCQ = async (req: any, res: any) => {
  const { tech, difficulty } = req.body;

  const data = await generateMCQs(tech, difficulty);

  const interview = await MCQ.create({
    userId: req.userId,
    tech,
    difficulty,
    questions: data.questions,
  });

  res.json(interview);
};

export const submitMCQ = async (req: any, res: any) => {
  const { interviewId, answers } = req.body;

  const interview = await MCQ.findById(interviewId);

  if(!interview) {
    return res.status(404).json({ message: "Interview not found" });
  }
  if (interview.userId !== req.userId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const result = evaluateMCQ(interview.questions, answers);

  interview.userAnswers = answers;
  interview.score = result.score;
  interview.feedback = result.feedback;
  interview.status = "completed";

  await interview.save();

  res.json(interview);
};