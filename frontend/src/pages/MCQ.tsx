import { useMemo, useState } from "react";
import { api } from "../api/client";
import { useApiAuth } from "../hooks/useApiAuth";
import { BrainCircuit, CheckCircle, RotateCcw, Send, AlertCircle } from "lucide-react";

type MCQQuestion = {
  question: string;
  options: string[];
  correctAnswer?: string;
};

type MCQStartResponse = {
  _id: string;
  questions: MCQQuestion[];
};

type MCQSubmitResponse = {
  score: number;
  feedback?: unknown;
  _id?: string;
};

export default function MCQ() {
  useApiAuth();
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [result, setResult] = useState<MCQSubmitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tech, setTech] = useState("Node.js");
  const [difficulty, setDifficulty] = useState("beginner");

  const canSubmit = useMemo(() => {
    if (!interviewId) return false;
    if (!questions.length) return false;
    return answers.filter(Boolean).length === questions.length;
  }, [answers, interviewId, questions.length]);

  const startInterview = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers([]);
    try {
      const res = await api.post<MCQStartResponse>("/mcq/start", {
        tech,
        difficulty,
      });
      setQuestions(res.data.questions);
      setInterviewId(res.data._id);
    } catch (e: any) {
      setError(e?.message || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qIndex: number, option: string) => {
    const updated = [...answers];
    // Convert option to letter (A, B, C, D)
    const optionIndex = questions[qIndex].options.indexOf(option);
    const optionLetter = String.fromCharCode(65 + optionIndex); // 65 = 'A'
    updated[qIndex] = optionLetter;
    setAnswers(updated);
  };

  const submit = async () => {
    if (!interviewId) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post<MCQSubmitResponse>("/mcq/submit", {
        interviewId,
        answers,
      });
      setResult(res.data);
    } catch (e: any) {
      setError(e?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    // Calculate feedback for each question
    const questionFeedback = questions.map((q, i) => {
      const userAnswer = answers[i];
      const isCorrect = userAnswer === q.correctAnswer;
      // Convert option letters back to option text for display
      const userAnswerText = userAnswer && q.options[userAnswer.charCodeAt(0) - 65];
      const correctAnswerText = q.correctAnswer && q.options[q.correctAnswer.charCodeAt(0) - 65];
      
      return {
        question: q.question,
        userAnswer: userAnswerText,
        userAnswerLetter: userAnswer,
        correctAnswer: correctAnswerText,
        correctAnswerLetter: q.correctAnswer,
        isCorrect,
        options: q.options
      };
    });

    const correctCount = questionFeedback.filter(q => q.isCorrect).length;
    const wrongCount = questionFeedback.filter(q => !q.isCorrect).length;

    return (
      <div className="p-6 lg:p-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">Quiz Completed!</h1>
            <p className="mt-2 text-lg text-slate-300">Here's how you performed</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm text-center mb-8">
            <div className="mb-6">
              <div className="text-sm font-medium text-slate-400 mb-2">Final Score</div>
              <div className="text-5xl font-bold text-white">{result.score}%</div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl border border-green-500/20 bg-green-950/30 p-4">
                <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                <div className="text-sm text-green-300">Correct Answers</div>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-950/30 p-4">
                <div className="text-2xl font-bold text-red-400">{wrongCount}</div>
                <div className="text-sm text-red-300">Wrong Answers</div>
              </div>
            </div>

            <button
              onClick={() => startInterview()}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 font-medium text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
            >
              <RotateCcw className="h-4 w-4" />
              Start New Session
            </button>
          </div>

          {/* Detailed Feedback Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6">Detailed Feedback</h2>
            <div className="space-y-6">
              {questionFeedback.map((feedback, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-6 ${
                    feedback.isCorrect 
                      ? 'border-green-500/20 bg-green-950/30' 
                      : 'border-red-500/20 bg-red-950/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                      feedback.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {feedback.isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-semibold text-white">Question {i + 1}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          feedback.isCorrect 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {feedback.isCorrect ? 'Correct' : 'Wrong'}
                        </span>
                      </div>
                      
                      <div className="text-white mb-4">{feedback.question}</div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-slate-400">Your answer:</div>
                        <div className={`rounded-lg border p-3 ${
                          feedback.isCorrect 
                            ? 'border-green-500/30 bg-green-500/10 text-green-300' 
                            : 'border-red-500/30 bg-red-500/10 text-red-300'
                        }`}>
                          {feedback.userAnswer || 'Not answered'}
                        </div>
                        
                        {!feedback.isCorrect && feedback.correctAnswer && (
                          <>
                            <div className="text-sm text-slate-400 mt-3">Correct answer:</div>
                            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-green-300">
                              {feedback.correctAnswer}
                            </div>
                          </>
                        )}
                        
                        {/* Show all options with indicators */}
                        <div className="mt-4 space-y-2">
                          <div className="text-sm text-slate-400">All options:</div>
                          {feedback.options.map((option, j) => {
                            const optionLetter = String.fromCharCode(65 + j);
                            const isCorrect = optionLetter === feedback.correctAnswerLetter;
                            const isUserAnswer = optionLetter === feedback.userAnswerLetter;
                            
                            return (
                              <div
                                key={j}
                                className={`rounded-lg border p-2 text-sm flex items-center gap-2 ${
                                  isCorrect
                                    ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                    : isUserAnswer && !feedback.isCorrect
                                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                    : 'border-slate-700/30 bg-slate-800/30 text-slate-400'
                                }`}
                              >
                                {isCorrect && (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                                {isUserAnswer && !feedback.isCorrect && (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                                <span className="font-medium mr-2">{optionLetter}.</span>
                                {option}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
          <h1 className="text-3xl font-bold text-white lg:text-4xl">MCQ Practice</h1>
          <p className="mt-2 text-lg text-slate-300">
            Test your knowledge with AI-generated multiple-choice questions
          </p>
        </div>

        {/* Setup Section */}
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-6">Quiz Setup</h2>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Technology Stack
              </label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                placeholder="e.g. React, Node.js, Python"
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

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={startInterview}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-medium text-white hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-60 transition-all duration-200"
            >
              <BrainCircuit className="h-4 w-4" />
              {loading ? "Starting..." : "Start Quiz Session"}
            </button>
            
            <button
              onClick={() => {
                setQuestions([]);
                setInterviewId(null);
                setAnswers([]);
                setError(null);
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 font-medium text-slate-300 hover:border-slate-500 hover:bg-slate-800 transition-all duration-200"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-950/50 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-200">Error</h3>
                <p className="mt-1 text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Questions Section */}
        {questions.length > 0 && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-300">Progress</span>
                <span className="text-sm text-slate-400">
                  {answers.filter(Boolean).length} / {questions.length} answered
                </span>
              </div>
              <div className="w-full rounded-full bg-slate-700">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${(answers.filter(Boolean).length / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Questions */}
            {questions.map((q, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                      <span className="text-sm font-bold text-white">{i + 1}</span>
                    </div>
                    <h3 className="text-lg font-medium text-white">{q.question}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {answers[i] && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                    <span className="text-sm text-slate-400">
                      {answers[i] ? "Answered" : "Unanswered"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {q.options.map((opt, j) => {
                    const optionLetter = String.fromCharCode(65 + j);
                    const selected = answers[i] === optionLetter;
                    return (
                      <button
                        key={j}
                        onClick={() => handleAnswer(i, opt)}
                        className={`w-full rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
                          selected
                            ? "border-blue-500 bg-blue-500/10 text-white"
                            : "border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-500 hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                            selected 
                              ? "border-blue-500 bg-blue-500" 
                              : "border-slate-600"
                          }`}>
                            {selected && (
                              <div className="h-full w-full rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium mr-2">{optionLetter}.</span>
                          <span className="text-sm">{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Submit Section */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-300">Ready to submit?</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {answers.filter(Boolean).length === questions.length 
                      ? "All questions answered" 
                      : `${questions.length - answers.filter(Boolean).length} questions remaining`}
                  </div>
                </div>
                
                <button
                  onClick={submit}
                  disabled={!canSubmit || submitting}
                  className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-200 ${
                    canSubmit && !submitting
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}