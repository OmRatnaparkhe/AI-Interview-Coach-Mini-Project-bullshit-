import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useApiAuth } from "../hooks/useApiAuth";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { 
  BrainCircuit, 
  Mic, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle, 
  Target 
} from "lucide-react";

export default function Dashboard() {
  useApiAuth();
  const navigate = useNavigate();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(
    null
  );
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await api.get<{ onboardingCompleted?: boolean }>("/me");
      setOnboardingCompleted(!!res.data?.onboardingCompleted);
    })();
  }, []);

  useEffect(() => {
    if (onboardingCompleted === false) {
      navigate("/onboarding", { replace: true });
    }
  }, [navigate, onboardingCompleted]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/insights/summary");
        setSummary(res.data);
      } catch {
        // keep dashboard usable even if insights fail
      }
    })();
  }, []);

  const chartData = useMemo(() => {
    const mcq = (summary?.recentScores?.mcq ?? []).map((x: any) => ({
      type: "MCQ",
      score: x.score,
      createdAt: x.createdAt,
      day: String(x.createdAt).slice(0, 10),
    }));
    const voice = (summary?.recentScores?.voice ?? []).map((x: any) => ({
      type: "Voice",
      score: x.score,
      createdAt: x.createdAt,
      day: String(x.createdAt).slice(0, 10),
    }));
    return [...mcq, ...voice]
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
      .map((x) => ({ day: x.day, score: x.score }));
  }, [summary]);

  return (
    <div className="p-6 lg:p-12">
      <div className="mx-auto max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            Welcome back!
          </h1>
          <p className="mt-2 text-lg text-slate-300">
            Ready to continue your interview preparation journey?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <button
            onClick={() => navigate("/mcq")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-left transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/25"
          >
            <div className="relative z-10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">MCQ Practice</h3>
              <p className="mt-2 text-blue-100">Test your knowledge with AI-generated questions</p>
              <div className="mt-4 flex items-center gap-2 text-white font-medium">
                Start Practice
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
          </button>

          <button
            onClick={() => navigate("/voice")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-left transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/25"
          >
            <div className="relative z-10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Voice Interview</h3>
              <p className="mt-2 text-purple-100">Practice speaking with AI voice analysis</p>
              <div className="mt-4 flex items-center gap-2 text-white font-medium">
                Start Session
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-slate-400">Total</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary?.totals?.all ?? "—"}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              MCQ {summary?.totals?.mcq ?? "—"} · Voice {summary?.totals?.voice ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-slate-400">MCQ</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary?.averages?.mcq ?? "—"}
            </div>
            <div className="mt-2 text-sm text-slate-400">Average Score</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-slate-400">Voice</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary?.averages?.voice ?? "—"}
            </div>
            <div className="mt-2 text-sm text-slate-400">Average Score</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-slate-400">Goal</span>
            </div>
            <div className="text-2xl font-bold text-white">85%</div>
            <div className="mt-2 text-sm text-slate-400">Target Score</div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Recent Performance</h3>
              <p className="text-sm text-slate-400">Last 30 sessions</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#475569" />
                <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 12,
                    color: "#e2e8f0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#scoreFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}