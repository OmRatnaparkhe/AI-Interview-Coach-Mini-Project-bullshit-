import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useApiAuth } from "../hooks/useApiAuth";

type Me = {
  onboardingCompleted?: boolean;
  preferences?: {
    stacks?: string[];
    languages?: string[];
    experienceLevel?: string;
    targetRole?: string;
  };
};

const STACKS = ["MERN", "MEAN", "Next.js", "React Native", "Backend (Node)"] as const;
const LANGS = ["JavaScript", "TypeScript", "Python", "Java", "Go"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export default function Onboarding() {
  useApiAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stacks, setStacks] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<(typeof LEVELS)[number]>(
    "beginner"
  );
  const [targetRole, setTargetRole] = useState("Full-stack Developer");

  const canSave = useMemo(
    () => stacks.length > 0 && languages.length > 0 && !!targetRole.trim(),
    [stacks.length, languages.length, targetRole]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Me>("/me");
        if (res.data?.onboardingCompleted) {
          navigate("/", { replace: true });
          return;
        }
        setStacks(res.data?.preferences?.stacks ?? []);
        setLanguages(res.data?.preferences?.languages ?? []);
        setExperienceLevel(
          (res.data?.preferences?.experienceLevel as any) || "beginner"
        );
        setTargetRole(res.data?.preferences?.targetRole || "Full-stack Developer");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await api.put("/onboarding", { stacks, languages, experienceLevel, targetRole });
      navigate("/", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
        <p className="mt-2 text-slate-300">
          Tell us what you’re preparing for and we’ll tailor your practice sessions.
        </p>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="text-lg font-medium">Stacks</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {STACKS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStacks((p) => toggle(p, s))}
                  className={
                    "rounded-full border px-3 py-1 text-sm " +
                    (stacks.includes(s)
                      ? "border-slate-200 bg-slate-100 text-slate-950"
                      : "border-slate-700 text-slate-100 hover:border-slate-500")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium">Languages</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguages((p) => toggle(p, l))}
                  className={
                    "rounded-full border px-3 py-1 text-sm " +
                    (languages.includes(l)
                      ? "border-slate-200 bg-slate-100 text-slate-950"
                      : "border-slate-700 text-slate-100 hover:border-slate-500")
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-medium">Experience</h2>
              <select
                className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <h2 className="text-lg font-medium">Target role</h2>
              <input
                className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
              />
            </div>
          </section>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Signed in. Preferences save to your account.
          </div>
          <button
            onClick={save}
            disabled={!canSave || saving}
            className={
              "rounded-lg px-4 py-2 " +
              (canSave && !saving
                ? "bg-slate-100 text-slate-950 hover:bg-white"
                : "bg-slate-800 text-slate-400 cursor-not-allowed")
            }
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

