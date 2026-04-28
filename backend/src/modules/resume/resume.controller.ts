import type { Request, Response } from "express";
import { analyzeResume } from "./resume.service.js";

export async function analyzeResumeController(req: Request, res: Response) {
  try {
    console.log("=== Resume Analysis Request Debug ===");
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Content-Length:", req.headers['content-length']);
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Request file:", req.file);
    console.log("Request files (if any):", req.files);
    console.log("Is multipart?:", req.is('multipart/form-data'));
    
    if (!req.file) {
      console.log("ERROR: No file found in request");
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
