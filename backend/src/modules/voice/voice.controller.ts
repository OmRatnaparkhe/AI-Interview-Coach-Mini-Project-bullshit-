import Voice from "../../models/voice.model.js";
import { generateMCQs } from "../mcq/mcq.service.js"; // reuse question logic
import { transcribeAudio, evaluateVoice, startLiveInterview, processUserResponse, generateLiveInterviewEvaluation } from "./voice.service.js";

export const startVoice = async (req: any, res: any) => {
  const { tech, difficulty } = req.body;

  const data = await generateMCQs(tech, difficulty);

  const questions = data.questions.map((q: any) => q.question);

  const interview = await Voice.create({
    userId: req.userId,
    tech,
    difficulty,
    questions,
  });

  res.json(interview);
};

export const uploadAnswer = async (req: any, res: any) => {
  try {
    const { interviewId, questionIndex } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No audio file provided" });
    }

    const filePath = req.file.path;

    // Transcribe the audio
    let transcription;
    try {
      transcription = await transcribeAudio(filePath);
    } catch (transcriptionError) {
      console.error("Transcription error:", transcriptionError);
      // Clean up the file if transcription fails
      const fs = await import('fs/promises');
      await fs.unlink(filePath).catch(() => {});
      return res.status(500).json({ 
        message: "Failed to transcribe audio. Please try recording again." 
      });
    }

    const interview = await Voice.findById(interviewId);

    if(!interview){
      // Clean up the file if interview not found
      const fs = await import('fs/promises');
      await fs.unlink(filePath).catch(() => {});
      return res.status(404).json({ message: "Interview not found" });
    }
    if (interview.userId !== req.userId) {
      // Clean up the file if unauthorized
      const fs = await import('fs/promises');
      await fs.unlink(filePath).catch(() => {});
      return res.status(403).json({ message: "Forbidden" });
    }

    interview.audioAnswers.push(filePath);
    
    // Handle question index alignment
    const idx = Number(questionIndex);
    if (Number.isFinite(idx) && idx >= 0) {
      while (interview.transcriptions.length <= idx) interview.transcriptions.push("");
      interview.transcriptions[idx] = transcription;
    } else {
      interview.transcriptions.push(transcription);
    }

    await interview.save();

    res.json({ transcription });
  } catch (error) {
    console.error("Upload answer error:", error);
    
    // Clean up the file if any error occurs
    if (req.file?.path) {
      const fs = await import('fs/promises');
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ 
      message: "Failed to process audio. Please try again." 
    });
  }
};

export const submitVoice = async (req: any, res: any) => {
  try {
    const { interviewId } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: "Interview ID is required" });
    }

    const interview = await Voice.findById(interviewId);

    if(!interview){
      return res.status(404).json({ message: "Interview not found" });
    }
    if (interview.userId !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Check if there are any transcriptions to evaluate
    if (!interview.transcriptions || interview.transcriptions.length === 0 || interview.transcriptions.every(t => !t.trim())) {
      return res.status(400).json({ 
        message: "No answers to evaluate. Please record at least one answer before submitting." 
      });
    }

    const result = await evaluateVoice(
      interview.questions,
      interview.transcriptions
    );

    interview.score = result.score;
    interview.feedback = result;
    interview.status = "completed";

    await interview.save();

    res.json(interview);
  } catch (error) {
    console.error("Submit voice error:", error);
    res.status(500).json({ 
      message: "Failed to evaluate interview. Please try again." 
    });
  }
};

// Live Interview Endpoints
export const startLiveVoiceInterview = async (req: any, res: any) => {
  try {
    const { tech, difficulty } = req.body;

    if (!tech || !difficulty) {
      return res.status(400).json({ message: "Tech and difficulty are required" });
    }

    // Start live interview with AI
    const interviewData = await startLiveInterview(tech, difficulty);

    // Create interview record
    const interview = await Voice.create({
      userId: req.userId,
      tech,
      difficulty,
      interviewType: "live",
      interviewId: interviewData.interviewId,
      conversation: [
        { type: "interviewer", text: interviewData.greeting, timestamp: new Date() },
        { type: "interviewer", text: interviewData.firstQuestion, timestamp: new Date() }
      ],
      currentQuestion: 1,
      totalQuestions: interviewData.totalQuestions,
      status: "active"
    });

    res.json({
      interviewId: interview._id,
      liveInterviewId: interviewData.interviewId,
      greeting: interviewData.greeting,
      firstQuestion: interviewData.firstQuestion,
      totalQuestions: interviewData.totalQuestions
    });
  } catch (error) {
    console.error("Start live interview error:", error);
    res.status(500).json({ 
      message: "Failed to start live interview. Please try again." 
    });
  }
};

export const processLiveResponse = async (req: any, res: any) => {
  try {
    const { interviewId, audioFile } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: "Interview ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No audio file provided" });
    }

    const interview = await Voice.findById(interviewId);

    if (!interview) {
      // Clean up file if interview not found
      const fs = await import('fs/promises');
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.userId !== req.userId) {
      // Clean up file if unauthorized
      const fs = await import('fs/promises');
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(403).json({ message: "Forbidden" });
    }

    if (interview.status !== "active") {
      // Clean up file if interview not active
      const fs = await import('fs/promises');
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: "Interview is not active" });
    }

    // Transcribe the audio
    let transcription;
    try {
      transcription = await transcribeAudio(req.file.path);
    } catch (transcriptionError) {
      console.error("Transcription error:", transcriptionError);
      // Clean up the file if transcription fails
      const fs = await import('fs/promises');
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(500).json({ 
        message: "Failed to transcribe audio. Please try recording again." 
      });
    }

    // Add user response to conversation
    interview.conversation.push({
      type: "candidate",
      text: transcription,
      timestamp: new Date()
    });

    // Process response with AI
    const aiResponse = await processUserResponse(
      interview.interviewId!,
      transcription,
      interview.currentQuestion,
      interview.tech || "General",
      interview.difficulty || "beginner"
    );

    // Add AI response to conversation
    interview.conversation.push({
      type: "interviewer",
      text: aiResponse.response,
      timestamp: new Date()
    });

    // Update interview state
    if (aiResponse.shouldEnd) {
      interview.status = "completed";
    } else if (!aiResponse.isFollowUp && aiResponse.nextQuestion) {
      interview.currentQuestion = aiResponse.questionNumber;
      interview.conversation.push({
        type: "interviewer",
        text: aiResponse.nextQuestion,
        timestamp: new Date()
      });
    }

    await interview.save();

    // Clean up the audio file
    const fs = await import('fs/promises');
    await fs.unlink(req.file.path).catch(() => {});

    res.json({
      aiResponse: aiResponse.response,
      nextQuestion: aiResponse.nextQuestion,
      isFollowUp: aiResponse.isFollowUp,
      shouldEnd: aiResponse.shouldEnd,
      questionNumber: aiResponse.questionNumber,
      transcription
    });
  } catch (error) {
    console.error("Process live response error:", error);
    
    // Clean up the file if any error occurs
    if (req.file?.path) {
      const fs = await import('fs/promises');
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ 
      message: "Failed to process response. Please try again." 
    });
  }
};

export const completeLiveInterview = async (req: any, res: any) => {
  try {
    const { interviewId } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: "Interview ID is required" });
    }

    const interview = await Voice.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.userId !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Generate evaluation based on conversation
    const evaluation = await generateLiveInterviewEvaluation(
      interview.interviewId!,
      interview.conversation
    );

    interview.score = evaluation.score;
    interview.feedback = evaluation;
    interview.status = "completed";

    await interview.save();

    res.json(evaluation);
  } catch (error) {
    console.error("Complete live interview error:", error);
    res.status(500).json({ 
      message: "Failed to complete interview. Please try again." 
    });
  }
};