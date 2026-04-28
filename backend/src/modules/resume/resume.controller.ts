import type { Request, Response } from "express";
import { analyzeResume } from "./resume.service.js";

export async function analyzeResumeController(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file uploaded" });
    }

    const analysis = await analyzeResume(req.file);
    res.json(analysis);
  } catch (error: any) {
    console.error("Resume analysis error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to analyze resume" 
    });
  }
}
