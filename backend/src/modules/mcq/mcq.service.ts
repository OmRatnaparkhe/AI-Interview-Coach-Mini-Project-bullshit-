import { openai } from "../../config/openai.js";
import { safeJSONParse } from "../../utils/jsonParser.js";

export const generateMCQs = async (tech: string, difficulty: string) => {
  const prompt = `
Generate 5 MCQs for ${tech} (${difficulty} level).

STRICT RULES:
- Return ONLY valid JSON
- No explanation
- No markdown
- correctAnswer must be option letter (A, B, C, or D)

Format:
{
  "questions": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": "A"
    }
  ]
}
`;

  const res = await openai.chat.completions.create({
    model:  "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
  });

  if (!res || !res.choices[0]) {
    return;
  }

  return safeJSONParse(res.choices[0].message.content || "");
};

export const evaluateMCQ = (questions: any[], answers: string[]) => {
  let correct = 0;

  questions.forEach((q, i) => {
    if (q.correctAnswer === answers[i]) correct++;
  });

  const score = (correct / questions.length) * 100;

  return {
    score,
    feedback: {
      correct,
      total: questions.length,
    },
  };
};