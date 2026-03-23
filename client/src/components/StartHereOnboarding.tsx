/**
 * "Start Here" Onboarding Flow
 * A 60-second guided tour for new candidates that:
 * 1. Asks about their target level (L4–L7) and interview timeline
 * 2. Shows a quick 3-step orientation (what's in each tab)
 * 3. Routes them to the Interview Readiness Report as their first action
 */
import { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Target,
  Calendar,
  Zap,
  BookOpen,
  Brain,
  GitBranch,
  BarChart3,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useInterviewDate } from "@/hooks/useLocalStorage";

interface Props {
  onDismiss: () => void;
  onNavigate: (tab: string, section?: string) => void;
}

type Level = "L4" | "L5" | "L6" | "L7";
type Timeline = "1-2 weeks" | "3-4 weeks" | "1-2 months" | "3+ months";

const LEVEL_DESCRIPTIONS: Record<
  Level,
  { title: string; focus: string; color: string }
> = {
  L4: {
    title: "Software Engineer (L4)",
    focus:
      "Coding fundamentals, basic system design, structured behavioral answers",
    color: "text-emerald-400",
  },
  L5: {
    title: "Senior Software Engineer (L5)",
    focus:
      "Advanced coding patterns, scalable system design, leadership signals",
    color: "text-blue-400",
  },
  L6: {
    title: "Staff Engineer (L6)",
    focus:
      "Ambiguous system design, cross-functional leadership, org-level impact",
    color: "text-violet-400",
  },
  L7: {
    title: "Senior Staff / Principal (L7)",
    focus:
      "Multi-system architecture, strategic thinking, executive communication",
    color: "text-amber-400",
  },
};

const TIMELINE_URGENCY: Record<
  Timeline,
  { label: string; badge: string; badgeColor: string }
> = {
  "1-2 weeks": {
    label: "Sprint mode — focus on your top 3 weak areas only",
    badge: "🔥 URGENT",
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  "3-4 weeks": {
    label: "Focused prep — cover all 3 domains with daily practice",
    badge: "⚡ ACTIVE",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  "1-2 months": {
    label: "Balanced prep — build depth across coding, design, and behavioral",
    badge: "📅 STEADY",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  "3+ months": {
    label: "Long-game prep — master fundamentals before mock sessions",
    badge: "🌱 BUILDING",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
};

export function StartHereOnboarding({ onDismiss, onNavigate }: Props) {
  const [step, setStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<Timeline | null>(
    null
  );
  const [, setInterviewDate] = useInterviewDate();

  const totalSteps = 4;

  const handleFinish = () => {
    // Navigate to Overview tab and scroll to the Readiness Report
    onNavigate("overview", "readiness-report");
    onDismiss();
  };

  const handleSetDate = () => {
    // Set a rough interview date based on timeline
    const now = new Date();
    const daysMap: Record<Timeline, number> = {
      "1-2 weeks": 10,
      "3-4 weeks": 25,
      "1-2 months": 45,
      "3+ months": 90,
    };
    if (selectedTimeline) {
      const days = daysMap[selectedTimeline];
      const date = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      setInterviewDate(date.toISOString().split("T")[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 0 0 1px rgba(59,130,246,0.2), 0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border bg-gradient-to-r from-blue-500/5 to-violet-500/5">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Start Here — 60-Second Setup
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Answer 2 quick questions so we can personalize your prep plan
          </p>
          {/* Progress bar */}
          <div className="flex gap-1 mt-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-blue-500" : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          {/* Step 0: Target level */}
          {step === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-blue-400" />
                <h2
                  className="text-base font-bold text-foreground"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  What level are you targeting?
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["L4", "L5", "L6", "L7"] as Level[]).map(level => {
                  const info = LEVEL_DESCRIPTIONS[level];
                  const isSelected = selectedLevel === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-border hover:border-blue-500/40 hover:bg-blue-500/5"
                      }`}
                    >
                      <div className={`text-sm font-bold mb-0.5 ${info.color}`}>
                        {level}
                      </div>
                      <div className="text-xs text-muted-foreground leading-tight">
                        {info.title.replace(level + " ", "")}
                      </div>
                      {isSelected && (
                        <div className="mt-1.5 text-[10px] text-blue-300 leading-tight">
                          {info.focus}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Timeline */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-amber-400" />
                <h2
                  className="text-base font-bold text-foreground"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  When is your interview?
                </h2>
              </div>
              <div className="space-y-2">
                {(
                  [
                    "1-2 weeks",
                    "3-4 weeks",
                    "1-2 months",
                    "3+ months",
                  ] as Timeline[]
                ).map(timeline => {
                  const info = TIMELINE_URGENCY[timeline];
                  const isSelected = selectedTimeline === timeline;
                  return (
                    <button
                      key={timeline}
                      onClick={() => setSelectedTimeline(timeline)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-border hover:border-amber-500/40 hover:bg-amber-500/5"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-foreground">
                            {timeline}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${info.badgeColor}`}
                          >
                            {info.badge}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {info.label}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle
                          size={16}
                          className="text-amber-400 shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Quick orientation */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={18} className="text-emerald-400" />
                <h2
                  className="text-base font-bold text-foreground"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  What's in this guide?
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Everything you need for{" "}
                {selectedLevel ? (
                  <span className={LEVEL_DESCRIPTIONS[selectedLevel].color}>
                    {selectedLevel}
                  </span>
                ) : (
                  "your target level"
                )}{" "}
                — organized by interview type.
              </p>
              <div className="space-y-2.5">
                <div className="flex gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <div className="text-xl">💻</div>
                  <div>
                    <div className="text-sm font-bold text-blue-300 mb-0.5">
                      Coding Tab
                    </div>
                    <div className="text-xs text-muted-foreground">
                      20 patterns · speed drills · mock sessions · AI coaching
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                  <div className="text-xl">🏗️</div>
                  <div>
                    <div className="text-sm font-bold text-violet-300 mb-0.5">
                      System Design Tab
                    </div>
                    <div className="text-xs text-muted-foreground">
                      12 questions · adversarial review · back-of-envelope
                      grader
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-xl">🧠</div>
                  <div>
                    <div className="text-sm font-bold text-emerald-300 mb-0.5">
                      Behavioral Tab
                    </div>
                    <div className="text-xs text-muted-foreground">
                      28 questions · STAR story bank · persona stress test
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="text-xl">📊</div>
                  <div>
                    <div className="text-sm font-bold text-amber-300 mb-0.5">
                      Overview Tab
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Readiness report · study planner · full mock day simulator
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Launch readiness report */}
          {step === 3 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🚀</div>
              <h2
                className="text-lg font-bold text-foreground mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Your personalized plan is ready
              </h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                We'll generate your{" "}
                <span className="text-blue-400 font-semibold">
                  Interview Readiness Report
                </span>{" "}
                — a 1-page AI summary of your top 3 action items based on your
                current prep state.
              </p>

              {/* Summary card */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4 text-left mb-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Target size={13} className="text-blue-400" />
                  <span className="text-xs text-muted-foreground">
                    Target level:{" "}
                    <span
                      className={`font-bold ${selectedLevel ? LEVEL_DESCRIPTIONS[selectedLevel].color : "text-foreground"}`}
                    >
                      {selectedLevel ?? "Not set"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-amber-400" />
                  <span className="text-xs text-muted-foreground">
                    Timeline:{" "}
                    <span className="font-bold text-amber-400">
                      {selectedTimeline ?? "Not set"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={13} className="text-emerald-400" />
                  <span className="text-xs text-muted-foreground">
                    First action:{" "}
                    <span className="font-bold text-emerald-400">
                      Run Readiness Report
                    </span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  handleSetDate();
                  handleFinish();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
              >
                <BarChart3 size={16} />
                Generate My Readiness Report
                <ArrowRight size={16} />
              </button>
              <button
                onClick={onDismiss}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now — take me to the guide
              </button>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {step < 3 && (
          <div className="px-6 pb-5 flex items-center justify-between">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-sm text-muted-foreground disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={13} /> Back
            </button>
            <span className="text-xs text-muted-foreground">
              {step + 1} of {totalSteps}
            </span>
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 0 && !selectedLevel) ||
                (step === 1 && !selectedTimeline)
              }
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
            >
              {step === 2 ? "Almost done" : "Next"} <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
