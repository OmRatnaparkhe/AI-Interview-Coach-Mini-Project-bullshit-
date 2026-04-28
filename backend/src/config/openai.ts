import OpenAI from "openai";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  throw new Error("Missing GROQ_API_KEY environment variable. Set GROQ_API_KEY in your .env or process environment.");
}

export const openai = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});