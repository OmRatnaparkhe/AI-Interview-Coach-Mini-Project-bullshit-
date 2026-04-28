import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { openai } from "../../config/openai.js";

export const transcribeAudio = async (filePath: string) => {
  // Check if file exists and has content
  try {
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      console.warn("Audio file is empty");
      return "No audio detected. Please try recording again.";
    }
  } catch (error) {
    console.error("Error checking audio file:", error);
    return "Audio file error. Please try recording again.";
  }
  
  const audio = fs.readFileSync(filePath);
  
  // Try Deepgram first
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  if (deepgramApiKey && deepgramApiKey !== 'your_key') {
    try {
      const res = await axios.post(
        "https://api.deepgram.com/v1/listen",
        audio,
        {
          headers: {
            Authorization: `Token ${deepgramApiKey}`,
            "Content-Type": "audio/webm",
          },
          params: {
            model: "nova-2",
            language: "en",
            smart_format: true
          }
        }
      );

      if (!res.data.results || !res.data.results.channels || !res.data.results.channels[0] || !res.data.results.channels[0].alternatives || !res.data.results.channels[0].alternatives[0]) {
        throw new Error("Invalid response from Deepgram API");
      }

      const transcript = res.data.results.channels[0].alternatives[0].transcript;
      if (transcript && transcript.trim().length > 3) {
        console.log("Deepgram transcription successful:", transcript);
        return transcript.trim();
      } else {
        throw new Error("Deepgram returned empty transcription");
      }
    } catch (error: any) {
      console.warn("Deepgram API failed:", error.message);
      // Fall through to OpenAI Whisper
    }
  }
  
  // Try OpenAI Whisper as backup
  try {
    const formData = new FormData();
    formData.append('file', audio, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    
    const res = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders()
        }
      }
    );

    if (res.data.text && res.data.text.trim().length > 3) {
      console.log("OpenAI Whisper transcription successful:", res.data.text);
      return res.data.text.trim();
    } else {
      throw new Error("OpenAI Whisper returned empty transcription");
    }
  } catch (error: any) {
    console.warn("OpenAI Whisper failed:", error.message);
  }
  
  // If both transcription services fail, return basic error message
  console.warn("All transcription services failed");
  return getBasicTranscription();
};

function getBasicTranscription(): string {
  // Return a simple message indicating transcription issue
  return "Audio transcription failed. Please speak clearly and try again.";
}

function getFallbackTranscription(): string {
  const fallbackTranscriptions = [
    "I would implement a comprehensive solution using React for the frontend with TypeScript for type safety. The backend would use Node.js with Express.js, and I'd integrate PostgreSQL for the database with Prisma ORM.",
    "For this technical challenge, I suggest using a microservices architecture with Docker containers. Each service would handle specific functionality like authentication, data processing, and API endpoints.",
    "The best approach would be to create a RESTful API with proper validation and error handling. I'd use JWT for authentication and implement rate limiting to prevent abuse.",
    "I would solve this by first analyzing the requirements thoroughly, then designing a scalable architecture. The solution would include proper testing, CI/CD pipeline, and monitoring for production readiness.",
    "For this issue, I recommend using a modern stack like Next.js with TypeScript, combined with a serverless architecture using AWS Lambda or Vercel for deployment.",
    "The solution involves implementing proper data validation, using Zod for schema validation, and ensuring all API endpoints have proper error handling and logging."
  ];
  
  const randomIndex = Math.floor(Math.random() * fallbackTranscriptions.length);
  return fallbackTranscriptions[randomIndex] ?? "Audio recorded successfully. Please continue with the interview.";
}

export const evaluateVoice = async (questions: string[], answers: string[]) => {
  // Validate inputs
  if (!questions || !answers || questions.length === 0 || answers.length === 0) {
    return getDefaultEvaluation();
  }

  // Calculate base score from answer quality
  const baseScore = calculateAnswerQuality(questions, answers);
  
  const prompt = `
You are an expert technical interviewer evaluating a candidate's performance.

INTERVIEW QUESTIONS:
${questions.map((q, i) => `Question ${i + 1}: ${q}`).join('\n')}

CANDIDATE ANSWERS:
${answers.map((a, i) => `Answer ${i + 1}: ${a}`).join('\n')}

EVALUATION CRITERIA:
1. Technical Accuracy (40%): Correctness of technical concepts, code examples, and problem-solving approach
2. Communication Skills (30%): Clarity, structure, and ability to explain complex topics
3. Problem-Solving (20%): Logical thinking, step-by-step approach, and solution quality
4. Completeness (10%): Thoroughness of answers and addressing all parts of questions

SCORING GUIDELINES:
- 90-100: Excellent - Deep technical knowledge with clear explanations
- 80-89: Good - Solid understanding with minor gaps
- 70-79: Average - Basic knowledge with some inaccuracies
- 60-69: Below Average - Significant knowledge gaps
- Below 60: Poor - Major technical deficiencies

Provide specific, actionable feedback. Focus on both strengths and areas for improvement.

Return ONLY valid JSON in this exact format:
{
  "score": 85,
  "technicalAccuracy": 88,
  "communicationSkills": 82,
  "problemSolving": 80,
  "completeness": 85,
  "strengths": ["Specific strength with examples", "Another strength with examples"],
  "weaknesses": ["Specific weakness with examples", "Another weakness with examples"],
  "suggestions": ["Specific suggestion", "Another suggestion"],
  "detailedFeedback": "Comprehensive feedback on overall performance"
}
`;

  try {
    const res = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1500,
    });

    if(!res || !res.choices[0] || !res.choices[0].message?.content) {
      console.error("No response from AI model");
      return getDefaultEvaluation();
    }

    let content = res.choices[0].message.content.trim();
    
    // Clean response to extract JSON
    if (content.includes('```json')) {
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    if (content.startsWith('```')) {
      content = content.replace(/```/g, '').trim();
    }

    // Find JSON object in response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    const parsed = JSON.parse(content);
    
    // Validate and enhance response
    const enhancedResult = validateAndEnhanceEvaluation(parsed, baseScore);
    
    return enhancedResult;
  } catch (error) {
    console.error("Voice evaluation error:", error);
    return getDefaultEvaluation();
  }
};

function calculateAnswerQuality(questions: string[], answers: string[]): number {
  let qualityScore = 50; // Base score
  
  // Check answer length and quality
  answers.forEach((answer, index) => {
    if (!answer || answer.trim().length < 20) {
      qualityScore -= 5; // Short or empty answers
    } else if (answer.trim().length > 200) {
      qualityScore += 2; // Detailed answers
    }
    
    // Check for technical keywords
    const technicalKeywords = ['implement', 'function', 'algorithm', 'database', 'api', 'react', 'nodejs', 'javascript', 'typescript'];
    const hasKeywords = technicalKeywords.some(keyword => 
      answer.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasKeywords) {
      qualityScore += 3; // Technical content detected
    }
  });
  
  return Math.max(30, Math.min(85, qualityScore));
}

function validateAndEnhanceEvaluation(aiResult: any, baseScore: number) {
  // Ensure all required fields exist
  const result = {
    score: aiResult.score || baseScore,
    technicalAccuracy: aiResult.technicalAccuracy || 75,
    communicationSkills: aiResult.communicationSkills || 75,
    problemSolving: aiResult.problemSolving || 75,
    completeness: aiResult.completeness || 75,
    strengths: Array.isArray(aiResult.strengths) ? aiResult.strengths : ["Demonstrated technical knowledge"],
    weaknesses: Array.isArray(aiResult.weaknesses) ? aiResult.weaknesses : ["Could provide more specific examples"],
    suggestions: Array.isArray(aiResult.suggestions) ? aiResult.suggestions : ["Practice explaining technical concepts clearly"],
    detailedFeedback: aiResult.detailedFeedback || "Overall performance shows room for improvement"
  };
  
  // Calculate weighted score if individual scores are provided
  if (typeof result.technicalAccuracy === 'number' && 
      typeof result.communicationSkills === 'number' && 
      typeof result.problemSolving === 'number' && 
      typeof result.completeness === 'number') {
    
    result.score = Math.round(
      result.technicalAccuracy * 0.4 + 
      result.communicationSkills * 0.3 + 
      result.problemSolving * 0.2 + 
      result.completeness * 0.1
    );
  }
  
  // Ensure score is within valid range
  result.score = Math.max(0, Math.min(100, result.score));
  
  // Ensure arrays have content
  if (result.strengths.length === 0) {
    result.strengths = ["Attempted to answer questions"];
  }
  
  if (result.weaknesses.length === 0) {
    result.weaknesses = ["Some answers lacked detail"];
  }
  
  if (result.suggestions.length === 0) {
    result.suggestions = ["Practice technical communication"];
  }
  
  return result;
}

// Live AI Interview Functions
export const startLiveInterview = async (tech: string, difficulty: string) => {
  const prompt = `
You are "Alex Morgan", an expert technical interviewer conducting a live voice interview for a ${tech} position at ${difficulty} level.

Generate an initial greeting and first question for the candidate. The interview should:
1. Be conversational and natural
2. Last approximately 5-7 questions total
3. Focus on practical, real-world scenarios
4. Adapt to the ${difficulty} level

Start with a warm greeting introducing yourself as Alex Morgan and ask your first question. Make it engaging and relevant to ${tech}.

Return ONLY valid JSON:
{
  "interviewId": "unique_id",
  "greeting": "Welcome message introducing yourself as Alex Morgan",
  "firstQuestion": "Your first technical question",
  "totalQuestions": 5
}
`;

  try {
    const res = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    if (!res || !res.choices[0] || !res.choices[0].message?.content) {
      throw new Error("Failed to generate interview content");
    }

    const content = res.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error starting live interview:", error);
    return {
      interviewId: Date.now().toString(),
      greeting: "Welcome to your technical interview! I'll be asking you some questions about " + tech + ". Let's start with our first question.",
      firstQuestion: "Can you tell me about your experience with " + tech + " and what you find most interesting about it?",
      totalQuestions: 5
    };
  }
};

export const processUserResponse = async (interviewId: string, userAnswer: string, questionNumber: number, tech: string, difficulty: string) => {
  const prompt = `
You are "Alex Morgan" conducting a live technical interview for a ${tech} position (${difficulty} level).

The candidate just answered question ${questionNumber}. Their response:
"${userAnswer}"

Evaluate their response and either:
1. Ask a follow-up question if their answer was incomplete or you want to explore deeper
2. Move to the next question if their answer was satisfactory
3. End the interview if this was the last question (around question 5-7)

Keep responses conversational and natural. If asking follow-up, make it specific to their answer. Always respond as Alex Morgan.

Return ONLY valid JSON:
{
  "response": "Your verbal response to the candidate",
  "nextQuestion": "Next question if moving on, or null if follow-up",
  "isFollowUp": true/false,
  "shouldEnd": true/false,
  "questionNumber": ${questionNumber + (questionNumber >= 5 ? 0 : 1)}
}
`;

  try {
    const res = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    if (!res || !res.choices[0] || !res.choices[0].message?.content) {
      throw new Error("Failed to process response");
    }

    const content = res.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error processing user response:", error);
    
    // Default fallback response
    if (questionNumber >= 5) {
      return {
        response: "Thank you for your responses. That concludes our interview. I'll provide you with a comprehensive evaluation shortly.",
        nextQuestion: null,
        isFollowUp: false,
        shouldEnd: true,
        questionNumber: questionNumber
      };
    }

    return {
      response: "That's interesting. Let me ask you about another aspect of " + tech + ".",
      nextQuestion: "How would you approach debugging a complex issue in a " + tech + " application?",
      isFollowUp: false,
      shouldEnd: false,
      questionNumber: questionNumber + 1
    };
  }
};

export const generateLiveInterviewEvaluation = async (interviewId: string, conversation: any[]) => {
  // Count candidate responses
  const candidateResponses = conversation.filter(item => item.type === 'candidate').length;
  const totalExchanges = conversation.length;
  
  // If no candidate responses, return appropriate evaluation
  if (candidateResponses === 0) {
    return {
      score: 0,
      strengths: [],
      weaknesses: ["No responses provided during interview", "Unable to assess technical skills", "No engagement demonstrated"],
      suggestions: ["Participate actively in interviews", "Practice answering technical questions", "Prepare for technical discussions"],
      detailedFeedback: "The interview was completed without any candidate responses. Unable to provide meaningful evaluation of technical skills or performance."
    };
  }

  const prompt = `
You are evaluating a candidate's performance in a live technical interview.

INTERVIEW CONVERSATION:
${conversation.map((item, i) => `
${item.type === 'interviewer' ? 'Alex Morgan (Interviewer):' : 'Candidate:'} ${item.text}
`).join('\n')}

INTERVIEW STATISTICS:
- Total exchanges: ${totalExchanges}
- Candidate responses: ${candidateResponses}
- Interview completion: ${candidateResponses < 3 ? 'incomplete' : 'completed'}

CRITICAL EVALUATION RULES:
1. If candidate provided 0-1 responses: Score should be 0-20
2. If candidate provided 2-3 responses: Score should be 20-50  
3. If candidate provided 4-5 responses: Score should be 50-75
4. If candidate provided 6+ responses: Score should be 75-95
5. Responses that are "Audio transcription failed" or similar should be treated as no response
6. Be honest and critical - do not give high scores for minimal participation

Evaluate the candidate's ACTUAL performance across these criteria:
1. Technical Accuracy (40%): Correctness of technical concepts, code examples, and solutions
2. Communication Skills (30%): Clarity, confidence, articulation, and structure of answers
3. Problem-Solving (20%): Logical approach, analytical thinking, and solution quality
4. Engagement (10%): Number of responses, participation level, and responsiveness

Provide SPECIFIC feedback based on their actual responses. Reference their actual answers in the feedback.

Return ONLY valid JSON with realistic overall score based on actual performance:
{
  "score": [actual_score_0_100],
  "strengths": ["specific_strength_from_actual_responses", "another_specific_strength"],
  "weaknesses": ["specific_weakness_from_actual_responses", "another_specific_weakness"],
  "suggestions": ["specific_suggestion_based_on_performance", "another_specific_suggestion"],
  "detailedFeedback": "honest_assessment_based_on_actual_conversation"
}
`;

  try {
    const res = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    if (!res || !res.choices[0] || !res.choices[0].message?.content) {
      return getDefaultLiveEvaluation();
    }

    const content = res.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return validateLiveEvaluation(parsed);
    }

    return getDefaultLiveEvaluation();
  } catch (error) {
    console.error("Error generating live interview evaluation:", error);
    return getDefaultLiveEvaluation();
  }
};

function validateLiveEvaluation(aiResult: any) {
  return {
    score: Math.max(0, Math.min(100, aiResult.score || 50)),
    strengths: Array.isArray(aiResult.strengths) && aiResult.strengths.length > 0 
      ? aiResult.strengths.filter((s: string) => s.trim() !== "") 
      : ["Attempted to participate in interview"],
    weaknesses: Array.isArray(aiResult.weaknesses) && aiResult.weaknesses.length > 0 
      ? aiResult.weaknesses.filter((w: string) => w.trim() !== "")
      : ["Limited participation during interview"],
    suggestions: Array.isArray(aiResult.suggestions) && aiResult.suggestions.length > 0 
      ? aiResult.suggestions.filter((s: string) => s.trim() !== "")
      : ["Practice active participation in technical interviews"],
    detailedFeedback: aiResult.detailedFeedback || "The candidate's performance shows room for improvement in technical communication and engagement."
  };
}

function getDefaultLiveEvaluation() {
  return {
    score: 30,
    strengths: [
      "Attempted to participate in interview"
    ],
    weaknesses: [
      "Insufficient responses provided",
      "Unable to assess technical skills properly",
      "Limited engagement demonstrated",
      "Interview completed with minimal participation"
    ],
    suggestions: [
      "Practice active participation in technical interviews",
      "Prepare for technical questions and discussions",
      "Work on providing detailed responses to questions",
      "Practice speaking clearly and confidently"
    ],
    detailedFeedback: "The interview was completed with minimal candidate participation. Unable to provide meaningful assessment of technical skills due to insufficient responses. More active engagement is needed for proper evaluation."
  };
}

function getDefaultEvaluation() {
  return {
    score: 65,
    technicalAccuracy: 60,
    communicationSkills: 65,
    problemSolving: 70,
    completeness: 65,
    strengths: [
      "Attempted to answer all questions",
      "Showed willingness to engage with technical topics",
      "Demonstrated basic communication skills"
    ],
    weaknesses: [
      "Answers lacked technical depth",
      "Could provide more specific examples",
      "Limited explanation of complex concepts"
    ],
    suggestions: [
      "Study fundamental technical concepts more thoroughly",
      "Practice explaining technical topics with real-world examples",
      "Work on structuring answers with clear introduction, body, and conclusion"
    ],
    detailedFeedback: "The candidate showed effort but needs significant improvement in technical knowledge and communication skills to perform well in technical interviews."
  };
}