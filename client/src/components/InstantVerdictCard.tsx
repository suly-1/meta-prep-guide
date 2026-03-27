/**
 * InstantVerdictCard — Feature #18
 * One-click "Am I ready?" assessment that analyzes the user's current
 * localStorage progress data and returns a hire/no-hire verdict with
 * IC level estimate, top 3 strengths, top 3 gaps, and a 48-hour action plan.
 * Uses the existing generateVerdict tRPC procedure.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import {
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

interface DimensionScore {
  dimensionId: string;
  score: number;
  level: string;
  gap: string;
  coachingNote: string;
}

interface VerdictResult {
  overallScore: number;
  verdict: string;
  icLevel: string;
  dimensionScores: DimensionScore[];
  strengths: string[];
  criticalGaps: string[];
  hiringRecommendation: string;
  nextSteps: string[];
}

// Full RUBRIC definition mirrored from VerdictEngineTab so InstantVerdictCard
// can build a properly-structured ratings array using the same dimension IDs.
const RUBRIC_META = [
  { id: "problem_solving", name: "Problem Solving", category: "coding", weight: 3,
    ic5Bar: "Solves medium problems with hints. Brute force first, then optimizes when prompted.",
    ic6Bar: "Solves medium-hard problems independently. Identifies optimal approach before coding. States complexity unprompted.",
    ic7Bar: "Solves hard problems elegantly. Identifies multiple approaches, explains tradeoffs, and chooses optimal without prompting." },
  { id: "code_quality", name: "Code Quality", category: "coding", weight: 2,
    ic5Bar: "Functional code with minor issues. Some variable naming issues. Handles main cases.",
    ic6Bar: "Clean, readable code. Good naming. Handles edge cases. Modular structure.",
    ic7Bar: "Production-quality code. Excellent abstractions. Comprehensive edge cases. Could be merged as-is." },
  { id: "system_design_breadth", name: "System Design Breadth", category: "system_design", weight: 3,
    ic5Bar: "Covers main components. Misses some NFRs. Basic scalability discussion.",
    ic6Bar: "Covers all major components. States NFRs upfront. Discusses scalability, availability, consistency tradeoffs.",
    ic7Bar: "Comprehensive design. Deep NFR analysis. Proactively identifies failure modes. Discusses operational concerns." },
  { id: "system_design_depth", name: "System Design Depth", category: "system_design", weight: 3,
    ic5Bar: "Can explain components at high level. Struggles with deep dives.",
    ic6Bar: "Can go 2-3 levels deep on any component. Knows internal workings of chosen technologies.",
    ic7Bar: "Expert-level depth. Can discuss implementation details, failure modes, and operational concerns for every component." },
  { id: "behavioral_impact", name: "Behavioral: Impact", category: "behavioral", weight: 2,
    ic5Bar: "Describes projects. Impact is vague ('improved performance', 'team was happy').",
    ic6Bar: "Quantified impact with metrics. Clear before/after. Business outcome stated.",
    ic7Bar: "Exceptional impact. Cross-org influence. Metrics that moved business KPIs." },
  { id: "behavioral_ownership", name: "Behavioral: Ownership", category: "behavioral", weight: 2,
    ic5Bar: "Uses 'we' frequently. Hard to separate individual contribution from team effort.",
    ic6Bar: "Clear 'I' ownership. Explains specific decisions made. Acknowledges team but owns contribution.",
    ic7Bar: "Drives org-wide initiatives. Owns outcomes beyond their team. Influences without authority." },
  { id: "communication", name: "Communication", category: "behavioral", weight: 2,
    ic5Bar: "Answers questions but doesn't volunteer structure. Sometimes unclear.",
    ic6Bar: "Clear, structured communication. Signals transitions ('Now I'll discuss X'). Checks for alignment.",
    ic7Bar: "Exceptional clarity. Adapts communication style. Makes complex ideas simple. Leads the conversation." },
  { id: "leadership", name: "Leadership & Influence", category: "leadership", weight: 2,
    ic5Bar: "Executes well on assigned work. Limited cross-team collaboration.",
    ic6Bar: "Influences team decisions. Mentors others. Drives projects with ambiguous scope.",
    ic7Bar: "Org-level influence. Defines technical direction. Grows other engineers. Drives cultural change." },
];

interface StoredDimensionRating {
  dimensionId: string;
  rating: number;
  evidence: string[];
  notes: string;
}

/**
 * Attempt to load ratings saved by VerdictEngineTab (localStorage key: verdict-engine-ratings).
 * Returns null if no data is found or it's malformed.
 */
function loadVerdictEngineRatings(): StoredDimensionRating[] | null {
  try {
    const raw = localStorage.getItem("verdict-engine-ratings");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDimensionRating[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Verify at least one dimension has a non-default rating
    const hasRealData = parsed.some((r) => r.rating > 1 || r.evidence.length > 0 || r.notes.trim() !== "");
    return hasRealData ? parsed : null;
  } catch {
    return null;
  }
}

function gatherProgressData() {
  const data: Record<string, unknown> = {};

  // Pattern ratings
  try {
    const ratings = JSON.parse(localStorage.getItem("pattern-ratings") || "{}");
    const rated = Object.values(ratings) as number[];
    data.avgPatternRating = rated.length > 0
      ? Math.round(rated.reduce((s, v) => s + v, 0) / rated.length * 10) / 10
      : null;
    data.patternsRated = rated.length;
    data.strongPatterns = rated.filter((r) => r >= 4).length;
    data.weakPatterns = rated.filter((r) => r <= 2).length;
  } catch {}

  // CTCI solved
  try {
    const solved = JSON.parse(localStorage.getItem("ctci-solved") || "{}");
    data.ctciSolved = Object.values(solved).filter(Boolean).length;
  } catch {}

  // Coding history
  try {
    const history = JSON.parse(localStorage.getItem("coding-history") || "[]");
    if (Array.isArray(history)) {
      data.codingSessions = history.length;
      const recentSessions = history.slice(-10);
      const avgTime = recentSessions.length > 0
        ? recentSessions.reduce((s: number, h: { duration?: number }) => s + (h.duration || 0), 0) / recentSessions.length
        : null;
      data.avgCodingTimeMin = avgTime ? Math.round(avgTime / 60) : null;
    }
  } catch {}

  // Behavioral stories
  try {
    const stories = JSON.parse(localStorage.getItem("star-stories") || "{}");
    data.starStoriesWritten = Object.keys(stories).length;
  } catch {}

  // Verdict history
  try {
    const verdicts = JSON.parse(localStorage.getItem("verdict-engine-history") || "[]");
    if (Array.isArray(verdicts) && verdicts.length > 0) {
      const scores = verdicts.map((v: { overallScore?: number }) => v.overallScore || 0);
      data.prevVerdictAvg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
      data.prevVerdictCount = verdicts.length;
      data.latestVerdict = verdicts[0];
    }
  } catch {}

  // Streak
  try {
    const streak = JSON.parse(localStorage.getItem("streak") || "0");
    data.currentStreak = streak;
  } catch {}

  // Spaced repetition due count
  try {
    const sr = JSON.parse(localStorage.getItem("spaced-repetition") || "{}");
    const now = Date.now();
    const due = Object.values(sr).filter((v: unknown) => {
      const item = v as { nextReview?: number };
      return item.nextReview && item.nextReview <= now;
    }).length;
    data.srDueCount = due;
  } catch {}

  return data;
}

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  strong_hire: {
    label: "Strong Hire",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    icon: <CheckCircle size={20} className="text-emerald-400" />,
  },
  hire: {
    label: "Hire",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: <CheckCircle size={20} className="text-emerald-400" />,
  },
  borderline: {
    label: "Borderline",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    icon: <AlertCircle size={20} className="text-amber-400" />,
  },
  no_hire: {
    label: "No Hire",
    color: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    icon: <XCircle size={20} className="text-red-400" />,
  },
};

export default function InstantVerdictCard() {
  const [result, setResult] = useState<VerdictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(true);

  const generateVerdict = trpc.ai.generateVerdict.useMutation({
    onSuccess: (data) => {
      setResult(data.verdict as VerdictResult);
      setLoading(false);
      // Save to history
      try {
        const history = JSON.parse(localStorage.getItem("verdict-engine-history") || "[]");
        history.unshift({ ...data.verdict, timestamp: Date.now() });
        localStorage.setItem("verdict-engine-history", JSON.stringify(history.slice(0, 20)));
      } catch {}
      toast.success("Verdict generated!");
    },
    onError: (err) => {
      setLoading(false);
      toast.error(`Verdict failed: ${err.message}`);
    },
  });

  const handleGenerate = () => {
    setLoading(true);
    setResult(null);
    const progressData = gatherProgressData();

    // ── Primary path: use VerdictEngine rubric ratings if the user has filled them in ──
    const savedRatings = loadVerdictEngineRatings();
    if (savedRatings) {
      const ratings = savedRatings.map((r) => {
        const dim = RUBRIC_META.find((d) => d.id === r.dimensionId);
        return {
          dimensionId: r.dimensionId,
          dimensionName: dim?.name ?? r.dimensionId,
          category: dim?.category ?? "general",
          weight: dim?.weight ?? 2,
          rating: Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5,
          evidence: r.evidence,
          notes: r.notes,
          ic5Bar: dim?.ic5Bar ?? "",
          ic6Bar: dim?.ic6Bar ?? "",
          ic7Bar: dim?.ic7Bar ?? "",
        };
      });
      generateVerdict.mutate({ ratings });
      return;
    }

    // ── Fallback path: derive ratings heuristically from other localStorage keys ──
    const ratings = [
      {
        dimensionId: "coding-patterns",
        dimensionName: "Coding Patterns",
        category: "Technical",
        weight: 0.30,
        rating: Math.min(5, Math.max(1, Math.round((progressData.avgPatternRating as number) || 2))),
        evidence: [
          `${progressData.patternsRated ?? 0} patterns rated`,
          `${progressData.strongPatterns ?? 0} strong (4-5★)`,
          `${progressData.weakPatterns ?? 0} weak (1-2★)`,
        ],
        notes: `CTCI solved: ${progressData.ctciSolved ?? 0}`,
        ic5Bar: "Solves easy patterns independently",
        ic6Bar: "Solves medium patterns fluently, explains trade-offs",
        ic7Bar: "Solves hard patterns, optimises proactively",
      },
      {
        dimensionId: "coding-speed",
        dimensionName: "Coding Speed & Efficiency",
        category: "Technical",
        weight: 0.15,
        rating: progressData.codingSessions
          ? Math.min(5, Math.max(1, Math.round((progressData.codingSessions as number) / 5)))
          : 2,
        evidence: [
          `${progressData.codingSessions ?? 0} coding sessions`,
          `Avg time: ${progressData.avgCodingTimeMin ?? "unknown"} min`,
        ],
        notes: `Streak: ${progressData.currentStreak ?? 0} days`,
        ic5Bar: "Completes easy problems in 30 min",
        ic6Bar: "Completes medium problems in 25 min",
        ic7Bar: "Completes hard problems in 35 min with full analysis",
      },
      {
        dimensionId: "behavioral",
        dimensionName: "Behavioral & STAR Stories",
        category: "Behavioral",
        weight: 0.25,
        rating: Math.min(5, Math.max(1, Math.round(((progressData.starStoriesWritten as number) || 0) / 4))),
        evidence: [
          `${progressData.starStoriesWritten ?? 0} STAR stories written`,
        ],
        notes: "",
        ic5Bar: "4+ stories covering core Meta values",
        ic6Bar: "8+ stories with measurable impact",
        ic7Bar: "12+ stories with org-level scope",
      },
      {
        dimensionId: "consistency",
        dimensionName: "Consistency & Preparation Depth",
        category: "Process",
        weight: 0.15,
        rating: Math.min(5, Math.max(1, Math.round(((progressData.currentStreak as number) || 0) / 3) + 1)),
        evidence: [
          `${progressData.currentStreak ?? 0}-day streak`,
          `${progressData.srDueCount ?? 0} SR items due`,
        ],
        notes: `Previous verdicts: ${progressData.prevVerdictCount ?? 0}`,
        ic5Bar: "7-day streak, SR up to date",
        ic6Bar: "14-day streak, all SR reviewed",
        ic7Bar: "21+ day streak, proactive gap closure",
      },
      {
        dimensionId: "verdict-trend",
        dimensionName: "Mock Verdict Trend",
        category: "Assessment",
        weight: 0.15,
        rating: progressData.prevVerdictAvg
          ? Math.min(5, Math.max(1, Math.round((progressData.prevVerdictAvg as number) / 20)))
          : 1,
        evidence: [
          `Avg verdict score: ${progressData.prevVerdictAvg ?? "none"}`,
          `${progressData.prevVerdictCount ?? 0} verdicts run`,
        ],
        notes: "",
        ic5Bar: "Score >= 50",
        ic6Bar: "Score >= 70",
        ic7Bar: "Score >= 85",
      },
    ];
    generateVerdict.mutate({ ratings });
  };

  const verdictConfig = result
    ? VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.borderline
    : null;

  const scoreColor = result
    ? result.overallScore >= 75
      ? "text-emerald-400"
      : result.overallScore >= 55
      ? "text-amber-400"
      : "text-red-400"
    : "text-muted-foreground";

  const hasVerdictEngineData = loadVerdictEngineRatings() !== null;

  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Instant Verdict Card</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              One-click readiness check · Hire / No-Hire · IC level estimate
            </p>
            {hasVerdictEngineData ? (
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-semibold">
                ✓ Using Verdict Engine rubric scores
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400 font-semibold">
                ⚡ Using heuristic scores — fill Verdict Engine for precision
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {result && (
            <button
              onClick={() => setResult(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold transition-all"
          >
            {loading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap size={12} />
            )}
            {loading ? "Analyzing..." : result ? "Re-run" : "Get Verdict"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-lg bg-secondary/30 border border-border p-6 text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Analyzing your preparation data...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Checking patterns, stories, sessions, and history
          </p>
        </div>
      )}

      {/* Result */}
      {result && verdictConfig && (
        <div className="space-y-3">
          {/* Main verdict banner */}
          <div className={`rounded-xl border p-4 ${verdictConfig.bg} ${verdictConfig.border}`}>
            <div className="flex items-center gap-3">
              {verdictConfig.icon}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-black ${verdictConfig.color}`}>
                    {verdictConfig.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary/50 text-xs font-semibold text-muted-foreground">
                    {result.icLevel}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 rounded-full bg-secondary/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        result.overallScore >= 75
                          ? "bg-emerald-500"
                          : result.overallScore >= 55
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${result.overallScore}%` }}
                    />
                  </div>
                  <span className={`text-sm font-black ${scoreColor}`}>
                    {result.overallScore}/100
                  </span>
                </div>
              </div>
            </div>
            {result.hiringRecommendation && (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                {result.hiringRecommendation}
              </p>
            )}
          </div>

          {/* Strengths & Gaps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.strengths?.length > 0 && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={12} className="text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-300">Top Strengths</span>
                </div>
                <ul className="space-y-1">
                  {result.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-[11px] text-emerald-200/80 flex items-start gap-1.5">
                      <span className="text-emerald-400 shrink-0">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.criticalGaps?.length > 0 && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target size={12} className="text-red-400" />
                  <span className="text-[11px] font-semibold text-red-300">Critical Gaps</span>
                </div>
                <ul className="space-y-1">
                  {result.criticalGaps.slice(0, 3).map((g, i) => (
                    <li key={i} className="text-[11px] text-red-200/80 flex items-start gap-1.5">
                      <span className="text-red-400 shrink-0">!</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Dimension scores */}
          {result.dimensionScores?.length > 0 && (
            <div>
              <button
                onClick={() => setShowDimensions(!showDimensions)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDimensions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Dimension breakdown ({result.dimensionScores.length})
              </button>
              {showDimensions && (
                <div className="mt-2 space-y-2">
                  {result.dimensionScores.map((d) => (
                    <div key={d.dimensionId} className="rounded-lg bg-secondary/20 border border-border p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-foreground capitalize">
                          {d.dimensionId.replace(/_/g, " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{d.level}</span>
                          <span className={`text-xs font-bold ${
                            d.score >= 75 ? "text-emerald-400" : d.score >= 55 ? "text-amber-400" : "text-red-400"
                          }`}>
                            {d.score}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full ${
                            d.score >= 75 ? "bg-emerald-500" : d.score >= 55 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${d.score}%` }}
                        />
                      </div>
                      {d.coachingNote && (
                        <p className="text-[10px] text-muted-foreground">{d.coachingNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 48-hour action plan */}
          {result.nextSteps?.length > 0 && (
            <div>
              <button
                onClick={() => setShowNextSteps(!showNextSteps)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNextSteps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                <Clock size={12} />
                48-Hour Action Plan
              </button>
              {showNextSteps && (
                <div className="mt-2 rounded-lg bg-secondary/30 border border-border p-3">
                  <ul className="space-y-2">
                    {result.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && (
        <div className="rounded-lg bg-secondary/20 border border-border p-4 text-center">
          <Zap size={24} className="mx-auto mb-2 text-violet-400/50" />
          <p className="text-sm text-muted-foreground">Click "Get Verdict" to analyze your current preparation level.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Analyzes your patterns, stories, sessions, and history from localStorage.
          </p>
        </div>
      )}
    </div>
  );
}
