/**
 * Personalized Weak-Spot Study Plan Generator
 * Builds a 7-day plan from: AI review scores, pattern ratings, behavioral ratings
 * Each day maps to the weakest dimension with a specific tool from the app
 */
import { useState, useMemo } from "react";
import { useAIReviewHistory } from "@/hooks/useLocalStorage";
import {
  usePatternRatings,
  useBehavioralRatings,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Zap,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeakDimension {
  label: string;
  avgScore: number;
  tool: string;
  toolAnchor: string;
  icon: string;
  description: string;
}

interface StudyDay {
  day: number;
  label: string;
  focus: string;
  tool: string;
  toolAnchor: string;
  task: string;
  icon: string;
  score: number;
}

// ─── Tool mapping ─────────────────────────────────────────────────────────────
const TOOL_MAP: Record<string, { tool: string; anchor: string; icon: string }> =
  {
    "Coding Correctness": {
      tool: "AI Solution Reviewer",
      anchor: "#code-practice",
      icon: "💻",
    },
    "Time/Space Complexity": {
      tool: "Complexity Analyzer",
      anchor: "#code-practice",
      icon: "⏱️",
    },
    "Edge Case Coverage": {
      tool: "AI Hint System",
      anchor: "#code-practice",
      icon: "🔍",
    },
    "Code Quality": {
      tool: "L7 Optimization Challenge",
      anchor: "#code-practice",
      icon: "✨",
    },
    "Pattern Recognition": {
      tool: "Pattern Recognition Trainer",
      anchor: "#code-practice",
      icon: "🧩",
    },
    "System Design": {
      tool: "Guided Walkthrough Mode",
      anchor: "#system-design",
      icon: "🏗️",
    },
    "Scale Estimation": {
      tool: "Scale Estimation Calculator",
      anchor: "#system-design",
      icon: "📊",
    },
    "Trade-off Reasoning": {
      tool: "Trade-off Decision Simulator",
      anchor: "#system-design",
      icon: "⚖️",
    },
    "Behavioral STAR": {
      tool: "Flashcard Flip Deck",
      anchor: "#behavioral",
      icon: "🎯",
    },
    "XFN Communication": {
      tool: "Voice Answer Mode",
      anchor: "#behavioral",
      icon: "🎤",
    },
  };

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Score helpers ────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 4) return "text-emerald-400";
  if (score >= 3) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 4) return "bg-emerald-500/10 border-emerald-500/30";
  if (score >= 3) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function scoreBar(score: number) {
  const pct = (score / 5) * 100;
  const color =
    score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-700">
        <div
          className={`h-1.5 rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold ${scoreColor(score)}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function WeakSpotStudyPlan() {
  const [aiHistory] = useAIReviewHistory();
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [expanded, setExpanded] = useState(false);
  const [completedDays, setCompletedDays] = useState<Set<number>>(() => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem("weak_spot_plan_completed_v1") ?? "[]")
      );
    } catch {
      return new Set();
    }
  });

  const toggleDay = (day: number) => {
    setCompletedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      localStorage.setItem(
        "weak_spot_plan_completed_v1",
        JSON.stringify(Array.from(next))
      );
      return next;
    });
  };

  // ── Compute weak dimensions ──────────────────────────────────────────────
  const weakDimensions = useMemo((): WeakDimension[] => {
    const dims: WeakDimension[] = [];

    // From AI review history
    if (aiHistory.length >= 3) {
      const recent = aiHistory.slice(-20);
      const avgScore = (field: keyof (typeof recent)[0]) =>
        recent.reduce((s, r) => s + (Number(r[field]) || 0), 0) / recent.length;

      dims.push(
        {
          label: "Coding Correctness",
          avgScore: avgScore("correctness"),
          tool: "AI Solution Reviewer",
          toolAnchor: "#code-practice",
          icon: "💻",
          description: "Correctness of your algorithmic solutions",
        },
        {
          label: "Time/Space Complexity",
          avgScore: avgScore("complexity"),
          tool: "Complexity Analyzer",
          toolAnchor: "#code-practice",
          icon: "⏱️",
          description: "Accuracy of your complexity analysis",
        },
        {
          label: "Edge Case Coverage",
          avgScore: avgScore("edgeCases"),
          tool: "AI Hint System",
          toolAnchor: "#code-practice",
          icon: "🔍",
          description: "Identifying and handling edge cases",
        },
        {
          label: "Code Quality",
          avgScore: avgScore("codeQuality"),
          tool: "L7 Optimization Challenge",
          toolAnchor: "#code-practice",
          icon: "✨",
          description: "Code clarity, naming, and structure",
        }
      );
    }

    // From pattern ratings
    const ratedPatterns = PATTERNS.filter(
      p => patternRatings[p.id] !== undefined
    );
    if (ratedPatterns.length >= 3) {
      const avgPatternScore =
        ratedPatterns.reduce((s, p) => s + (patternRatings[p.id] ?? 3), 0) /
        ratedPatterns.length;
      // Normalize 1-5 rating to 0-5 score (1=very weak → 1.0, 5=mastered → 5.0)
      dims.push({
        label: "Pattern Recognition",
        avgScore: avgPatternScore,
        tool: "Pattern Recognition Trainer",
        toolAnchor: "#code-practice",
        icon: "🧩",
        description: "Recognizing which pattern to apply",
      });
    }

    // From behavioral ratings
    const ratedBQs = BEHAVIORAL_QUESTIONS.filter(
      q => bqRatings[q.id] !== undefined
    );
    if (ratedBQs.length >= 3) {
      const avgBQScore =
        ratedBQs.reduce((s, q) => s + (bqRatings[q.id] ?? 3), 0) /
        ratedBQs.length;
      dims.push({
        label: "Behavioral STAR",
        avgScore: avgBQScore,
        tool: "Flashcard Flip Deck",
        toolAnchor: "#behavioral",
        icon: "🎯",
        description: "STAR story quality and specificity",
      });
    }

    // Always add system design and scale estimation as defaults if no data
    if (dims.length < 3) {
      dims.push(
        {
          label: "System Design",
          avgScore: 2.5,
          tool: "Guided Walkthrough Mode",
          toolAnchor: "#system-design",
          icon: "🏗️",
          description: "End-to-end system design ability",
        },
        {
          label: "Scale Estimation",
          avgScore: 2.5,
          tool: "Scale Estimation Calculator",
          toolAnchor: "#system-design",
          icon: "📊",
          description: "Capacity estimation accuracy",
        },
        {
          label: "Trade-off Reasoning",
          avgScore: 2.5,
          tool: "Trade-off Decision Simulator",
          toolAnchor: "#system-design",
          icon: "⚖️",
          description: "Articulating architectural trade-offs",
        },
        {
          label: "XFN Communication",
          avgScore: 2.5,
          tool: "Voice Answer Mode",
          toolAnchor: "#behavioral",
          icon: "🎤",
          description: "Cross-functional communication skills",
        }
      );
    }

    return dims.sort((a, b) => a.avgScore - b.avgScore);
  }, [aiHistory, patternRatings, bqRatings]);

  const hasData =
    aiHistory.length >= 3 ||
    Object.keys(patternRatings).length >= 3 ||
    Object.keys(bqRatings).length >= 3;

  // ── Build 7-day plan ─────────────────────────────────────────────────────
  const studyPlan = useMemo((): StudyDay[] => {
    const top3 = weakDimensions.slice(0, 3);
    const plan: StudyDay[] = [];

    // Day 1-3: Deep work on top 3 weaknesses
    top3.forEach((dim, i) => {
      plan.push({
        day: i + 1,
        label: WEEK_LABELS[i],
        focus: dim.label,
        tool: dim.tool,
        toolAnchor: dim.toolAnchor,
        task: `Do 3 focused sessions with ${dim.tool}. Target: improve ${dim.label.toLowerCase()} score from ${dim.avgScore.toFixed(1)} → ${Math.min(5, dim.avgScore + 0.8).toFixed(1)}.`,
        icon: dim.icon,
        score: dim.avgScore,
      });
    });

    // Day 4: Mixed review
    plan.push({
      day: 4,
      label: WEEK_LABELS[3],
      focus: "Mixed Review",
      tool: "AI Solution Reviewer + Voice Answer Mode",
      toolAnchor: "#code-practice",
      task: "Alternate between a coding problem and a behavioral question. Score both with AI. Aim for at least one L6 verdict in each.",
      icon: "🔄",
      score: 0,
    });

    // Day 5: Weak dimension 4 (or system design if not enough data)
    const dim4 = weakDimensions[3] ?? {
      label: "System Design",
      tool: "Guided Walkthrough Mode",
      toolAnchor: "#system-design",
      icon: "🏗️",
      avgScore: 2.5,
    };
    plan.push({
      day: 5,
      label: WEEK_LABELS[4],
      focus: dim4.label,
      tool: dim4.tool,
      toolAnchor: dim4.toolAnchor,
      task: `Work through ${dim4.tool} for 45 minutes. Focus on explaining your reasoning out loud, not just the answer.`,
      icon: dim4.icon,
      score: dim4.avgScore,
    });

    // Day 6: Full mock round
    plan.push({
      day: 6,
      label: WEEK_LABELS[5],
      focus: "Full Mock Round",
      tool: "Full Mock Day Simulator",
      toolAnchor: "#overview",
      task: "Run a full 2-round mock (Coding + Behavioral). Compare your scores to Day 1-3 baseline. Identify if the gap has closed.",
      icon: "🏆",
      score: 0,
    });

    // Day 7: Rest + reflection
    plan.push({
      day: 7,
      label: WEEK_LABELS[6],
      focus: "Reflection & Reset",
      tool: "Share Prep State URL",
      toolAnchor: "#overview",
      task: "Review your week's AI scores. Update your pattern and behavioral ratings. Generate a Share URL to snapshot your current readiness.",
      icon: "📊",
      score: 0,
    });

    return plan;
  }, [weakDimensions]);

  const completedCount = studyPlan.filter(d => completedDays.has(d.day)).length;

  return (
    <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-950/30 via-slate-900/60 to-indigo-950/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <CalendarDays size={18} className="text-blue-400" />
          <div className="text-left">
            <div className="text-sm font-bold text-foreground">
              Personalized 7-Day Study Plan
            </div>
            <div className="text-xs text-muted-foreground">
              {hasData
                ? `Built from your actual AI scores · ${completedCount}/7 days complete`
                : "Complete 3+ AI reviews to unlock personalized plan"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium">
              {completedCount}/7 done
            </span>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-blue-500/20">
          {/* Weak dimension analysis */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={13} className="text-red-400" />
              <span className="text-xs font-bold text-foreground">
                Your Weakest Dimensions
              </span>
              {!hasData && (
                <span className="text-xs text-amber-400 ml-auto">
                  Complete 3+ AI reviews for personalized data
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {weakDimensions.slice(0, 5).map(dim => (
                <div
                  key={dim.label}
                  className={`rounded-lg border p-2.5 ${scoreBg(dim.avgScore)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{dim.icon}</span>
                      <span className="text-xs font-semibold text-foreground">
                        {dim.label}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dim.tool}
                    </span>
                  </div>
                  {scoreBar(dim.avgScore)}
                </div>
              ))}
            </div>
          </div>

          {/* 7-day plan */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-blue-400" />
              <span className="text-xs font-bold text-foreground">
                Your 7-Day Plan
              </span>
              <button
                onClick={() => {
                  setCompletedDays(new Set());
                  localStorage.removeItem("weak_spot_plan_completed_v1");
                  toast.success("Plan reset — starting fresh!");
                }}
                className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={11} /> Reset
              </button>
            </div>
            <div className="space-y-2">
              {studyPlan.map(day => {
                const done = completedDays.has(day.day);
                return (
                  <div
                    key={day.day}
                    className={`rounded-lg border transition-all ${done ? "bg-emerald-500/5 border-emerald-500/20 opacity-70" : "bg-slate-800/40 border-slate-700/50"}`}
                  >
                    <div className="flex items-start gap-3 p-3">
                      {/* Day badge */}
                      <div
                        className={`shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center border ${done ? "bg-emerald-500/20 border-emerald-500/40" : "bg-slate-700/60 border-slate-600/50"}`}
                      >
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {day.label}
                        </span>
                        <span className="text-base">
                          {done ? "✓" : day.icon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-foreground">
                            {day.focus}
                          </span>
                          {day.score > 0 && (
                            <span
                              className={`text-[10px] font-semibold ${scoreColor(day.score)}`}
                            >
                              avg {day.score.toFixed(1)}/5
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {day.task}
                        </p>
                        <a
                          href={day.toolAnchor}
                          onClick={e => {
                            e.preventDefault();
                            const el = document.querySelector(
                              '[data-tab="' +
                                day.toolAnchor.replace("#", "") +
                                '"]'
                            );
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                            else toast.info(`Navigate to: ${day.tool}`);
                          }}
                          className="inline-flex items-center gap-1 mt-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          → Open {day.tool}
                        </a>
                      </div>

                      {/* Complete button */}
                      <button
                        onClick={() => {
                          toggleDay(day.day);
                          if (!done)
                            toast.success(`Day ${day.day} marked complete! 🎉`);
                        }}
                        className={`shrink-0 p-1.5 rounded-lg transition-all ${done ? "text-emerald-400 hover:text-red-400" : "text-muted-foreground hover:text-emerald-400"}`}
                        title={done ? "Mark incomplete" : "Mark complete"}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress summary */}
          {completedCount > 0 && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
              <div className="text-xs text-blue-300 font-semibold">
                {completedCount === 7
                  ? "🎉 Week complete! Run a Full Mock Day to measure your improvement."
                  : `${7 - completedCount} day${7 - completedCount !== 1 ? "s" : ""} remaining — keep going!`}
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                  style={{ width: `${(completedCount / 7) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
