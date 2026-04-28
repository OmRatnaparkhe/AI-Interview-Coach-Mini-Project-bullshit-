import { useState, useRef } from "react";
import { api } from "../api/client";
import { useApiAuth } from "../hooks/useApiAuth";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  AlertTriangle,
  Star,
  RefreshCw
} from "lucide-react";

type ResumeAnalysis = {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  formatAnalysis: {
    clarity: number;
    structure: number;
    completeness: number;
  };
  contentAnalysis: {
    skillsMatch: number;
    experienceRelevance: number;
    achievements: number;
  };
};

export default function ResumeReview() {
  useApiAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.type === "application/msword" || droppedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload a PDF or Word document");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf" || selectedFile.type === "application/msword" || selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload a PDF or Word document");
      }
    }
  };

  const analyzeResume = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await api.post("/resume/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalysis(res.data);
    } catch (e: any) {
      setError(e?.message || "Failed to analyze resume");
    } finally {
      setUploading(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  return (
    <div className="p-6 lg:p-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white lg:text-4xl">Resume Review</h1>
          <p className="mt-2 text-lg text-slate-300">
            Upload your resume and get AI-powered feedback to improve your chances of landing your dream job
          </p>
        </div>

        {!analysis ? (
          /* Upload Section */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Upload */}
            <div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white mb-6">Upload Resume</h2>
                
                <div
                  className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                    dragActive
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="flex flex-col items-center">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg mb-4 ${
                      file ? "bg-green-500/20" : "bg-slate-800"
                    }`}>
                      {file ? (
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      ) : (
                        <Upload className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    
                    <div className="text-white font-medium mb-2">
                      {file ? file.name : "Drop your resume here or click to browse"}
                    </div>
                    
                    {!file && (
                      <div className="text-slate-400 text-sm">
                        Supports PDF, DOC, DOCX (Max 10MB)
                      </div>
                    )}
                    
                    {file && (
                      <div className="text-slate-400 text-sm">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={analyzeResume}
                    disabled={!file || uploading}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-200 ${
                      file && !uploading
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
                        : "bg-slate-700 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Analyze Resume
                      </>
                    )}
                  </button>
                  
                  {file && (
                    <button
                      onClick={resetAnalysis}
                      className="rounded-lg border border-slate-700 px-6 py-3 font-medium text-slate-300 hover:border-slate-500 hover:bg-slate-800 transition-all duration-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white mb-6">What We Analyze</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 flex-shrink-0">
                      <Star className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Content Quality</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Relevance of skills, experience, and achievements to your target role
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 flex-shrink-0">
                      <FileText className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Format & Structure</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Clarity, organization, and professional presentation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Impact & Achievements</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Quantifiable results and career progression
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/20 flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Improvement Areas</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Specific recommendations to strengthen your resume
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-8">
            {/* Overall Score */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Resume Analysis Complete</h2>
                
                <div className={`inline-flex items-center gap-3 rounded-xl border px-6 py-4 ${getScoreBgColor(analysis.overallScore)}`}>
                  <span className="text-sm font-medium text-slate-300">Overall Score</span>
                  <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                    {analysis.overallScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
              <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Format Analysis */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-6">Format Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Clarity</span>
                      <span className={`text-sm font-medium ${getScoreColor(analysis.formatAnalysis.clarity)}`}>
                        {analysis.formatAnalysis.clarity}%
                      </span>
                    </div>
                    <div className="w-full rounded-full bg-slate-700">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${analysis.formatAnalysis.clarity}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Structure</span>
                      <span className={`text-sm font-medium ${getScoreColor(analysis.formatAnalysis.structure)}`}>
                        {analysis.formatAnalysis.structure}%
                      </span>
                    </div>
                    <div className="w-full rounded-full bg-slate-700">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${analysis.formatAnalysis.structure}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Completeness</span>
                      <span className={`text-sm font-medium ${getScoreColor(analysis.formatAnalysis.completeness)}`}>
                        {analysis.formatAnalysis.completeness}%
                      </span>
                    </div>
                    <div className="w-full rounded-full bg-slate-700">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${analysis.formatAnalysis.completeness}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Analysis */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-6">Content Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Skills Match</span>
                      <span className={`text-sm font-medium ${getScoreColor(analysis.contentAnalysis.skillsMatch)}`}>
                        {analysis.contentAnalysis.skillsMatch}%
                      </span>
                    </div>
                    <div className="w-full rounded-full bg-slate-700">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${analysis.contentAnalysis.skillsMatch}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Experience Relevance</span>
                      <span className={`text-sm font-medium ${getScoreColor(analysis.contentAnalysis.experienceRelevance)}`}>
                        {analysis.contentAnalysis.experienceRelevance}%
                      </span>
                    </div>
                    <div className="w-full rounded-full bg-slate-700">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${analysis.contentAnalysis.experienceRelevance}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Achievements</span>
                      <span className={`text-sm font-medium ${getScoreColor(analysis.contentAnalysis.achievements)}`}>
                        {analysis.contentAnalysis.achievements}%
                      </span>
                    </div>
                    <div className="w-full rounded-full bg-slate-700">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${analysis.contentAnalysis.achievements}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Strengths */}
              <div className="rounded-2xl border border-green-500/20 bg-green-950/30 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Strengths</h3>
                </div>
                <ul className="space-y-3">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 flex-shrink-0 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                      </div>
                      <span className="text-green-300 text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-950/30 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Areas for Improvement</h3>
                </div>
                <ul className="space-y-3">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 flex-shrink-0 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-yellow-400" />
                      </div>
                      <span className="text-yellow-300 text-sm">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-950/30 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Recommendations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-blue-500/20 bg-blue-900/20">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 flex-shrink-0">
                      <span className="text-xs font-bold text-blue-400">{index + 1}</span>
                    </div>
                    <span className="text-blue-300 text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={resetAnalysis}
                className="flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 font-medium text-slate-300 hover:border-slate-500 hover:bg-slate-800 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                Analyze Another Resume
              </button>
            </div>
          </div>
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
