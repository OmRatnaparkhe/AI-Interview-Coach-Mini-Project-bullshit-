import { useState, useRef, useEffect } from "react";
import { api } from "../api/client";
import { useApiAuth } from "../hooks/useApiAuth";
import { Mic, Square, Phone, Clock, CheckCircle, AlertCircle } from "lucide-react";

type LiveInterviewStartResponse = {
  interviewId: string;
  liveInterviewId: string;
  greeting: string;
  firstQuestion: string;
  totalQuestions: number;
};

type LiveInterviewResponse = {
  aiResponse: string;
  nextQuestion: string | null;
  isFollowUp: boolean;
  shouldEnd: boolean;
  questionNumber: number;
  transcription: string;
};

type InterviewEvaluation = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  detailedFeedback: string;
};

export default function Voice() {
  useApiAuth();
  const [mode, setMode] = useState<'setup' | 'interview' | 'results'>('setup');
  const [tech, setTech] = useState("Node.js");
  const [difficulty, setDifficulty] = useState("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Interview state
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Array<{speaker: string, text: string, timestamp: Date}>>([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'interview' && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && mode === 'interview') {
      endInterview();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      setIsAISpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsAISpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsAISpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsAISpeaking(false);
    }
  };

  const startInterview = async () => {
    if (!tech.trim()) {
      setError("Please select a technology stack");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post<LiveInterviewStartResponse>("/voice/live/start", {
        tech,
        difficulty,
      });

      setInterviewId(res.data.interviewId);
      const fullMessage = res.data.greeting + " " + res.data.firstQuestion;
      setTotalQuestions(res.data.totalQuestions);
      setConversation([
        { speaker: "Alex Morgan", text: res.data.greeting, timestamp: new Date() },
        { speaker: "Alex Morgan", text: res.data.firstQuestion, timestamp: new Date() }
      ]);
      setMode('interview');
      setTimeRemaining(600); // Reset timer to 10 minutes
      
      // Speak the greeting and first question
      setTimeout(() => {
        speakText(fullMessage);
      }, 1000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Microphone permission denied");
    }
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !interviewId) return;

    setIsRecording(false);
    setIsProcessing(true);

    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });

    await stopped;

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const file = new File([blob], "response.webm", { type: "audio/webm" });

    const formData = new FormData();
    formData.append("audio", file);
    formData.append("interviewId", interviewId);

    try {
      const res = await api.post<LiveInterviewResponse>("/voice/live/response", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Add user transcription to conversation
      setConversation(prev => [
        ...prev,
        { speaker: "You", text: res.data.transcription, timestamp: new Date() }
      ]);

      // Add AI response to conversation
      setConversation(prev => [
        ...prev,
        { speaker: "Alex Morgan", text: res.data.aiResponse, timestamp: new Date() }
      ]);

      setCurrentQuestionNumber(res.data.questionNumber);

      // Speak the AI response
      speakText(res.data.aiResponse);

      // Handle next question or end interview
      if (res.data.shouldEnd) {
        setTimeout(() => endInterview(), 3000);
      } else if (res.data.nextQuestion) {
        setTimeout(() => {
          setConversation(prev => [
            ...prev,
            { speaker: "Alex Morgan", text: res.data.nextQuestion, timestamp: new Date() }
          ]);
          // Speak the next question
          speakText(res.data.nextQuestion);
        }, 3000);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to process response");
    } finally {
      setIsProcessing(false);
      chunksRef.current = [];
      mediaRecorderRef.current = null;
    }
  };

  const endInterview = async () => {
    if (!interviewId) return;
    
    setIsProcessing(true);
    setError(null);
    
    // Stop any AI speech immediately
    stopSpeaking();
    
    try {
      const res = await api.post<InterviewEvaluation>("/voice/live/complete", {
        interviewId,
        conversation: conversation.map(msg => ({
          type: msg.speaker === "Alex Morgan" ? "interviewer" : "candidate",
          text: msg.text,
          timestamp: msg.timestamp
        }))
      });

      setEvaluation(res.data);
      setMode('results');
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to complete interview");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetInterview = () => {
    setMode('setup');
    setInterviewId(null);
    setConversation([]);
    setCurrentQuestionNumber(1);
    setTimeRemaining(600);
    setEvaluation(null);
    setError(null);
  };

  if (mode === 'results' && evaluation) {
    return (
      <div className="p-6 lg:p-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">Interview Completed!</h1>
            <p className="mt-2 text-lg text-slate-300">Here's your performance evaluation</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm text-center mb-8">
            <div className="mb-6">
              <div className="text-sm font-medium text-slate-400 mb-2">Overall Score</div>
              <div className="text-5xl font-bold text-white">{evaluation.score}%</div>
            </div>

            
            <button
              onClick={resetInterview}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 font-medium text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
            >
              Start New Interview
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6">Detailed Feedback</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {evaluation.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3 text-green-300">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-3">Areas for Improvement</h3>
                <ul className="space-y-2">
                  {evaluation.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-center justify-center gap-3 text-red-300 text-center">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-3">Suggestions</h3>
                <ul className="space-y-2">
                  {evaluation.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-center justify-center gap-3 text-blue-300 text-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 flex-shrink-0 mt-0.5 text-xs font-bold text-blue-400">
                        {index + 1}
                      </span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Overall Assessment</h3>
                <p className="text-slate-300 leading-relaxed">{evaluation.detailedFeedback}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white lg:text-4xl">Live AI Interview</h1>
          <p className="mt-2 text-lg text-slate-300">
            Practice your interview skills with a live AI conversation
          </p>
        </div>

        {mode === 'setup' && (
          <>
            {/* Setup Section */}
            <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6">Interview Setup</h2>
              
              <div className="grid gap-6 sm:grid-cols-2 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Technology Stack
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={tech}
                    onChange={(e) => setTech(e.target.value)}
                    placeholder="e.g. Node.js, React, Python"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                <Clock className="h-4 w-4" />
                <span>Interview duration: 10 minutes</span>
                <span className="text-slate-500">•</span>
                <span>Questions: 5-7 adaptive questions</span>
              </div>

              <button
                onClick={startInterview}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-medium text-white hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-60 transition-all duration-200"
              >
                <Mic className="h-4 w-4" />
                {loading ? "Starting..." : "Start Live Interview"}
              </button>
            </div>
          </>
        )}

        {mode === 'interview' && (
          <>
            {/* Interview Interface */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span className={timeRemaining < 120 ? "text-red-400" : ""}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400">
                    Question {currentQuestionNumber} of {totalQuestions}
                  </div>
                </div>
                <button
                  onClick={endInterview}
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/30 px-4 py-2 text-red-400 hover:border-red-500/30 hover:bg-red-950/50 transition-all duration-200"
                >
                  <Phone className="h-4 w-4" />
                  End Interview
                </button>
              </div>

              {/* Conversation */}
              <div className="mb-6 max-h-96 overflow-y-auto space-y-4">
                {conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.speaker === "You" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-lg rounded-lg px-4 py-3 ${
                        msg.speaker === "You"
                          ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                          : "bg-slate-800/50 border border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="text-xs font-medium mb-1 opacity-70">
                        {msg.speaker}
                      </div>
                      <div className="text-sm">{msg.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              
              {/* Recording Controls */}
              <div className="flex items-center justify-center">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={isProcessing || isAISpeaking}
                    className={`flex items-center gap-3 rounded-full px-8 py-4 font-medium transition-all duration-200 ${
                      isProcessing || isAISpeaking
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-lg hover:shadow-red-500/25"
                    }`}
                  >
                    <Mic className="h-5 w-5" />
                    {isProcessing ? "Processing..." : isAISpeaking ? "AI Speaking..." : "Tap to Respond"}
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-8 py-4 font-medium text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200"
                  >
                    <Square className="h-5 w-5" />
                    Stop Recording
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-950/50 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-200">Error</h3>
                <p className="mt-1 text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
