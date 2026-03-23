// Design: Bold Engineering Dashboard — Overview Tab
// Features: L6/L7 comparison cards, readiness dashboard, pattern heatmap,
// weak-spot dashboard, interview countdown, STAR story bank, recruiter card
// with peer comparison, progress export, interview day checklist
import { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Printer,
  Target,
  Brain,
  TrendingUp,
  Flame,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Send,
  Trophy,
  HelpCircle,
} from "lucide-react";
import {
  PATTERNS,
  BEHAVIORAL_QUESTIONS,
  STAR_STORIES,
  PREP_TIMELINE,
  FAST_TRACK_TIMELINE,
  TEN_WEEK_TIMELINE,
  INTERVIEW_DAY_CHECKLIST,
  RESOURCES,
  IC_COMPARISON,
  PEER_BENCHMARKS,
} from "@/lib/data";
import {
  usePatternRatings,
  useBehavioralRatings,
  useMockHistory,
  useInterviewDate,
  useStarNotes,
  useStreak,
  useReadinessTrend,
  useCTCIStreak,
  useReadinessGoal,
  useHintAnalytics,
  useCTCIDifficultyEstimates,
  useAIReviewHistory,
} from "@/hooks/useLocalStorage";
import { CTCI_QUESTIONS } from "@/lib/ctciData";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import { FullMockDaySimulator } from "@/components/FullMockDaySimulator";
import {
  DailyStudyChecklist,
  UrgencyModeBanner,
  OnboardingChecklist,
} from "@/components/OverviewExtras";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DayOfModePanel,
  LastMileCheatSheet,
  ConfidenceCalibrationQuiz,
} from "@/components/DayOfMode";
import { WeakPatternHeatmap } from "@/components/WeakPatternHeatmap";
import { WeakSpotStudyPlan } from "@/components/WeakSpotStudyPlan";
import { InterviewReadinessReport } from "@/components/InterviewReadinessReport";

// ── Disclaimer Status Badge ──────────────────────────────────────────────────
function DisclaimerStatusBadge() {
  const { data } = trpc.disclaimer.status.useQuery();
  const { user } = useAuth();

  if (!data?.acknowledged || !data.acknowledgedAt) return null;

  const date = new Date(data.acknowledgedAt).toLocaleString();

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400">
      <span className="flex items-center gap-2">
        <span className="text-emerald-400">✓</span>
        <span>
          <span className="font-semibold">Disclaimer acknowledged</span>
          {" — "}
          <span className="text-muted-foreground">
            Server record saved on {date}
          </span>
        </span>
      </span>
      {user?.role === "admin" && (
        <a
          href="/admin/disclaimer"
          className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 whitespace-nowrap"
        >
          View audit report →
        </a>
      )}
    </div>
  );
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

//// ── L6/L7 Level Cards ────────────────────────────────────────────
function LevelCards() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between group"
      >
        <div className="section-title mb-0 pb-0 border-0 group-hover:text-foreground transition-colors">
          L4 · L5 · L6 · L7 — What FAANG Expects by Level
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{open ? "Collapse" : "Expand reference"}</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      {open && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* L6 */}
            <div className="prep-card p-5 border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-blue text-sm px-3 py-1">
                  L6 — Staff Engineer (FAANG)
                </span>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  [
                    "Scope & Impact",
                    "Leads major initiatives at team/org level. Defines technical direction for a domain.",
                  ],
                  [
                    "Technical Leadership",
                    "Designs systems used by 25–30+ engineers. Owns architecture decisions end-to-end.",
                  ],
                  [
                    "Business & XFN",
                    "Project-level cross-functional collaboration. Connects technical work to business outcomes.",
                  ],
                  [
                    "Communication",
                    "Clear and precise within team and org. Writes design docs that drive alignment.",
                  ],
                ].map(([title, desc]) => (
                  <div key={title}>
                    <div className="text-xs font-semibold text-blue-400 mb-0.5">
                      {title}
                    </div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* L7 */}
            <div className="prep-card p-5 border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-purple text-sm px-3 py-1">
                  L7 — Senior Staff Engineer (FAANG)
                </span>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  [
                    "Scope & Impact",
                    "Leads portfolios of initiatives across multiple teams. Shapes org-level technical strategy.",
                  ],
                  [
                    "Technical Leadership",
                    "Influences 30–50+ engineers. Sets the technical bar for the entire org.",
                  ],
                  [
                    "Business & XFN",
                    "Long-term strategic partnerships with product, design, and business leadership.",
                  ],
                  [
                    "Communication",
                    "Communicates across disciplines and all levels. Drives industry-level conversations.",
                  ],
                ].map(([title, desc]) => (
                  <div key={title}>
                    <div className="text-xs font-semibold text-purple-400 mb-0.5">
                      {title}
                    </div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Comparison table */}
          <div className="prep-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                      Dimension
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-blue-400">
                      L6
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-purple-400">
                      L7
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {IC_COMPARISON.map((row, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-secondary/20" : ""}
                    >
                      <td className="p-3 text-xs font-semibold text-foreground">
                        {row.dimension}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {row.ic6}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {row.ic7}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Readiness Trend Chart (14-day sparkline) ─────────────────────────────────────────────────────
function ReadinessTrendChart({ currentPct }: { currentPct: number }) {
  const [trend, setTrend] = useReadinessTrend();

  // Record today's snapshot once per day
  const today = new Date().toISOString().split("T")[0];
  // Use useEffect to avoid state updates during render
  const [recorded, setRecorded] = useState(false);
  if (
    !recorded &&
    (trend.length === 0 || trend[trend.length - 1].date !== today)
  ) {
    setRecorded(true);
    const pruned = [
      ...trend.filter(s => s.date !== today),
      { date: today, pct: currentPct },
    ]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
    setTrend(pruned);
  }

  if (trend.length < 2) {
    return (
      <div className="prep-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={13} className="text-emerald-400" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            14-Day Readiness Trend
          </span>
        </div>
        <div className="text-xs text-muted-foreground text-center py-4">
          Come back tomorrow to see your trend line.
        </div>
      </div>
    );
  }

  // Build last 14 days scaffold so missing days show as gaps
  const days: Array<{ date: string; pct: number | null }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const snap = trend.find(s => s.date === key);
    days.push({ date: key, pct: snap ? snap.pct : null });
  }

  const W = 280,
    H = 60,
    PAD = 4;
  const points = days
    .map((d, i) =>
      d.pct !== null
        ? {
            x: PAD + (i / 13) * (W - PAD * 2),
            y: H - PAD - (d.pct / 100) * (H - PAD * 2),
          }
        : null
    )
    .filter(Boolean) as { x: number; y: number }[];

  const polyline = points.map(p => `${p.x},${p.y}`).join(" ");
  const area =
    points.length > 1
      ? `M${points[0].x},${H - PAD} L${polyline
          .split(" ")
          .map(p => p)
          .join(" L")} L${points[points.length - 1].x},${H - PAD} Z`
      : "";

  const firstPct = trend[0].pct;
  const lastPct = trend[trend.length - 1].pct;
  const delta = lastPct - firstPct;
  const deltaColor =
    delta > 0
      ? "text-emerald-400"
      : delta < 0
        ? "text-red-400"
        : "text-muted-foreground";
  const deltaLabel =
    delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : "Flat";

  return (
    <div className="prep-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={13} className="text-emerald-400" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          14-Day Readiness Trend
        </span>
        <span className={`ml-auto text-xs font-bold ${deltaColor}`}>
          {deltaLabel} over {trend.length} days
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = H - PAD - (pct / 100) * (H - PAD * 2);
          return (
            <line
              key={pct}
              x1={PAD}
              y1={y}
              x2={W - PAD}
              y2={y}
              stroke="oklch(0.28 0.012 264)"
              strokeWidth="0.5"
            />
          );
        })}
        {/* Area fill */}
        {area && <path d={area} fill="oklch(0.62 0.19 158 / 0.15)" />}
        {/* Line */}
        {points.length > 1 && (
          <polyline
            points={polyline}
            fill="none"
            stroke="oklch(0.62 0.19 158)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="oklch(0.62 0.19 158)" />
        ))}
        {/* Today dot highlight */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3.5"
            fill="oklch(0.62 0.19 158)"
            stroke="oklch(0.15 0.01 264)"
            strokeWidth="1.5"
          />
        )}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{days[0].date.slice(5)}</span>
        <span>Today {lastPct}%</span>
      </div>
    </div>
  );
}

// ── Readiness Dashboard ─────────────────────────────────────────────────────
function loadSDHistory() {
  try {
    return JSON.parse(
      localStorage.getItem("sd_mock_history_v1") ?? "[]"
    ) as Array<{
      scorecard: { overallScore: number; level: string };
      date: string;
    }>;
  } catch {
    return [];
  }
}
function loadBehHistory() {
  try {
    return JSON.parse(
      localStorage.getItem("beh_mock_history_v1") ?? "[]"
    ) as Array<{
      scorecard: { overallScore: number; level: string };
      date: string;
    }>;
  } catch {
    return [];
  }
}

function levelToNum(level: string): number {
  if (level === "L7") return 3;
  if (level === "L6") return 2;
  return 1;
}

function ReadinessDashboard() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [mockHistory] = useMockHistory();
  const streak = useStreak();
  const masteredPatterns = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) >= 4
  ).length;
  const readyStories = BEHAVIORAL_QUESTIONS.filter(
    q => (bqRatings[q.id] ?? 0) >= 4
  ).length;
  const avgMock = mockHistory.length
    ? mockHistory.reduce((s, m) => s + m.avgScore, 0) / mockHistory.length
    : 0;

  // Load System Design and XFN Behavioral mock sessions from localStorage
  const sdHistory = loadSDHistory();
  const behHistory = loadBehHistory();
  const sdAvg = sdHistory.length
    ? sdHistory.reduce((s, e) => s + e.scorecard.overallScore, 0) /
      sdHistory.length
    : 0;
  const xfnAvg = behHistory.length
    ? behHistory.reduce((s, e) => s + e.scorecard.overallScore, 0) /
      behHistory.length
    : 0;
  const latestSDLevel = sdHistory.length
    ? sdHistory[sdHistory.length - 1].scorecard.level
    : null;
  const latestXFNLevel = behHistory.length
    ? behHistory[behHistory.length - 1].scorecard.level
    : null;

  // Combined IC readiness score (weighted): coding 40%, behavioral 30%, sys design 20%, xfn 10%
  const codingScore = (masteredPatterns / PATTERNS.length) * 5;
  const behavioralScore = (readyStories / BEHAVIORAL_QUESTIONS.length) * 5;
  const sdScore = sdAvg; // already 1-5
  const xfnScore = xfnAvg; // already 1-5
  const hasSDData = sdHistory.length > 0;
  const hasXFNData = behHistory.length > 0;

  let combinedScore: number;
  if (!hasSDData && !hasXFNData) {
    combinedScore = codingScore * 0.6 + behavioralScore * 0.4;
  } else if (!hasSDData) {
    combinedScore = codingScore * 0.5 + behavioralScore * 0.3 + xfnScore * 0.2;
  } else if (!hasXFNData) {
    combinedScore = codingScore * 0.5 + behavioralScore * 0.25 + sdScore * 0.25;
  } else {
    combinedScore =
      codingScore * 0.4 +
      behavioralScore * 0.3 +
      sdScore * 0.2 +
      xfnScore * 0.1;
  }
  const overallPct = Math.round((combinedScore / 5) * 100);

  // IC level signal: majority vote from available mock sessions
  const icSignals: number[] = [];
  if (latestSDLevel) icSignals.push(levelToNum(latestSDLevel));
  if (latestXFNLevel) icSignals.push(levelToNum(latestXFNLevel));
  const avgICNum = icSignals.length
    ? icSignals.reduce((a, b) => a + b, 0) / icSignals.length
    : 0;
  const icSignal =
    avgICNum >= 2.5
      ? "L7"
      : avgICNum >= 1.5
        ? "L6"
        : icSignals.length > 0
          ? "L5"
          : null;

  const weakPatterns = PATTERNS.filter(p => {
    const r = patternRatings[p.id] ?? 0;
    return r > 0 && r <= 2;
  }).slice(0, 3);
  const weakBQ = BEHAVIORAL_QUESTIONS.filter(q => {
    const r = bqRatings[q.id] ?? 0;
    return r > 0 && r <= 2;
  }).slice(0, 3);

  // Achievement badge share toasts
  useEffect(() => {
    const BADGE_MILESTONES: {
      pct: number;
      label: string;
      emoji: string;
      tweet: string;
    }[] = [
      {
        pct: 25,
        label: "Getting Started",
        emoji: "🚀",
        tweet:
          "🚀 I'm 25% ready for my Meta {level} interview! Starting my prep journey. #MetaInterview #SoftwareEngineering",
      },
      {
        pct: 50,
        label: "Halfway There",
        emoji: "⚡",
        tweet:
          "⚡ I'm 50% ready for my Meta {level} interview! Halfway through my prep. #MetaInterview #SoftwareEngineering",
      },
      {
        pct: 75,
        label: "Almost Ready",
        emoji: "🔥",
        tweet:
          "🔥 I'm 75% ready for my Meta {level} interview! Almost there. #MetaInterview #SoftwareEngineering",
      },
      {
        pct: 90,
        label: "Interview Ready",
        emoji: "⭐",
        tweet:
          "⭐ I'm 90%+ ready for my Meta {level} interview! Feeling confident. #MetaInterview #SoftwareEngineering",
      },
      {
        pct: 100,
        label: "L7 Ready",
        emoji: "🏆",
        tweet:
          "🏆 I've hit 100% readiness on my Meta {level} prep! Time to crush the interview. #MetaInterview #SoftwareEngineering",
      },
    ];
    const BADGE_KEY = "meta-prep-badge-shown";
    const shown: number[] = JSON.parse(localStorage.getItem(BADGE_KEY) ?? "[]");
    BADGE_MILESTONES.forEach(m => {
      if (overallPct >= m.pct && !shown.includes(m.pct)) {
        const levelLabel = icSignal ?? "L6/L7";
        const tweetText = m.tweet.replace("{level}", levelLabel);
        toast(
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{m.emoji}</span>
              <div>
                <div className="font-bold text-foreground text-sm">
                  Achievement: {m.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {overallPct}% IC Readiness reached!
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(tweetText);
                toast.success("Tweet copied!");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all w-fit"
            >
              📤 Share Achievement
            </button>
          </div>,
          { duration: 8000 }
        );
        localStorage.setItem(BADGE_KEY, JSON.stringify([...shown, m.pct]));
      }
    });
  }, [overallPct, icSignal]);

  return (
    <div className="space-y-4">
      {/* Overall readiness */}
      <div
        className={`prep-card p-5 ${overallPct >= 100 ? "border-emerald-500/40 bg-emerald-500/5" : ""}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="section-title mb-0 pb-0 border-0">
              Combined IC Readiness
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Coding 40% · Behavioral 30% · Sys Design 20% · XFN 10%
            </div>
          </div>
          <div className="text-right">
            <span
              className={`text-2xl font-extrabold stat-num ${overallPct >= 80 ? "text-emerald-400" : overallPct >= 50 ? "text-amber-400" : "text-red-400"}`}
            >
              {overallPct}%
            </span>
            {icSignal && (
              <div
                className={`text-xs font-bold mt-0.5 ${icSignal === "L7" ? "text-violet-400" : icSignal === "L6" ? "text-blue-400" : "text-muted-foreground"}`}
              >
                Signal: {icSignal}
              </div>
            )}
          </div>
        </div>
        <div className="progress-bar mb-4">
          <div
            className={`progress-bar-fill ${overallPct >= 80 ? "bg-emerald-500" : overallPct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-lg bg-secondary">
            <div className="stat-num text-base text-blue-400">
              {masteredPatterns}/{PATTERNS.length}
            </div>
            <div className="text-[10px] text-muted-foreground">Patterns</div>
            <div className="text-[10px] text-blue-400/70">40% weight</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary">
            <div className="stat-num text-base text-purple-400">
              {readyStories}/{BEHAVIORAL_QUESTIONS.length}
            </div>
            <div className="text-[10px] text-muted-foreground">BQ Stories</div>
            <div className="text-[10px] text-purple-400/70">30% weight</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary">
            <div
              className={`stat-num text-base ${hasSDData ? "text-cyan-400" : "text-muted-foreground"}`}
            >
              {hasSDData ? sdAvg.toFixed(1) : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">Sys Design</div>
            <div className="text-[10px] text-cyan-400/70">20% weight</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary">
            <div
              className={`stat-num text-base ${hasXFNData ? "text-teal-400" : "text-muted-foreground"}`}
            >
              {hasXFNData ? xfnAvg.toFixed(1) : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">XFN Mock</div>
            <div className="text-[10px] text-teal-400/70">10% weight</div>
          </div>
        </div>
        {(!hasSDData || !hasXFNData) && (
          <div className="mt-3 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-xs text-blue-400">
              💡 Complete{" "}
              {[
                !hasSDData && "a System Design mock",
                !hasXFNData && "an XFN Behavioral mock",
              ]
                .filter(Boolean)
                .join(" and ")}{" "}
              to unlock the full IC readiness gauge.
            </div>
          </div>
        )}
      </div>

      {/* Weak-spot dashboard */}
      {(weakPatterns.length > 0 || weakBQ.length > 0) && (
        <div className="prep-card p-4 border-amber-500/20">
          <div className="section-title text-amber-400 mb-3">
            ⚠ Weak-Spot Dashboard
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {weakPatterns.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Weak Patterns
                </div>
                <div className="space-y-1.5">
                  {weakPatterns.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                      <span className="badge badge-red">
                        ★{patternRatings[p.id]}
                      </span>
                      <span className="text-foreground">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {weakBQ.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Weak Behavioral Areas
                </div>
                <div className="space-y-1.5">
                  {weakBQ.map(q => (
                    <div key={q.id} className="flex items-center gap-2 text-xs">
                      <span className="badge badge-red">
                        ★{bqRatings[q.id]}
                      </span>
                      <span className="text-foreground truncate">{q.area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 14-day trend chart */}
      <ReadinessTrendChart currentPct={overallPct} />

      {/* Recruiter card with peer comparison */}
      <RecruiterCard
        masteredPatterns={masteredPatterns}
        readyStories={readyStories}
        avgMock={avgMock}
        streak={streak.currentStreak}
        overallPct={overallPct}
      />
    </div>
  );
}

// ── Recruiter Card with Peer Comparison ───────────────────────────────────
function RecruiterCard({
  masteredPatterns,
  readyStories,
  avgMock,
  streak,
  overallPct,
}: {
  masteredPatterns: number;
  readyStories: number;
  avgMock: number;
  streak: number;
  overallPct: number;
}) {
  const patternsPercentile =
    masteredPatterns >= PEER_BENCHMARKS.patternsTop20
      ? "Top 20%"
      : masteredPatterns >= PEER_BENCHMARKS.patternsTop50
        ? "Top 50%"
        : "Below median";
  const storiesPercentile =
    readyStories >= PEER_BENCHMARKS.storiesTop20
      ? "Top 20%"
      : readyStories >= PEER_BENCHMARKS.storiesTop50
        ? "Top 50%"
        : "Below median";
  const mockPercentile =
    avgMock >= PEER_BENCHMARKS.mockAvgTop20
      ? "Top 20%"
      : avgMock > 0
        ? "Average"
        : "No data";

  const handlePrint = () => window.print();

  return (
    <div className="prep-card p-5 border-indigo-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="section-title mb-0 pb-0 border-0 text-indigo-400">
          Recruiter-Ready Summary
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 text-xs font-semibold transition-all"
        >
          <Printer size={11} /> Print / Save PDF
        </button>
      </div>
      <div id="recruiter-card" className="space-y-3">
        {/* Overall readiness */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
          <TrendingUp size={16} className="text-emerald-400 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">
              Overall Readiness
            </div>
            <div className="progress-bar mt-1">
              <div
                className="progress-bar-fill bg-emerald-500"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
          <span className="text-lg font-bold stat-num text-emerald-400">
            {overallPct}%
          </span>
        </div>
        {/* Stats with peer comparison */}
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              icon: <Target size={13} className="text-blue-400" />,
              label: "Patterns Mastered",
              value: `${masteredPatterns}/${PATTERNS.length}`,
              peer: patternsPercentile,
            },
            {
              icon: <Brain size={13} className="text-purple-400" />,
              label: "Stories Ready",
              value: `${readyStories}/${BEHAVIORAL_QUESTIONS.length}`,
              peer: storiesPercentile,
            },
            {
              icon: <TrendingUp size={13} className="text-emerald-400" />,
              label: "Mock Avg Score",
              value: avgMock > 0 ? `${avgMock.toFixed(1)}/5` : "—",
              peer: mockPercentile,
            },
            {
              icon: <Flame size={13} className="text-orange-400" />,
              label: "Current Streak",
              value: `${streak} days`,
              peer:
                streak >= PEER_BENCHMARKS.streakTop20 ? "Top 20%" : "Active",
            },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-lg bg-secondary">
              <div className="flex items-center gap-1.5 mb-1">
                {item.icon}
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <div className="text-base font-bold stat-num text-foreground">
                {item.value}
              </div>
              <div
                className={`text-xs mt-0.5 ${item.peer === "Top 20%" ? "text-emerald-400" : item.peer === "Top 50%" ? "text-amber-400" : "text-muted-foreground"}`}
              >
                {item.peer}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground text-center pt-1">
          Peer benchmarks based on anonymised aggregate data from similar
          candidates
        </div>
      </div>
    </div>
  );
}

// ── Interview Countdown ────────────────────────────────────────────────────
function InterviewCountdown() {
  const [interviewDate, setInterviewDate] = useInterviewDate();
  const daysLeft = interviewDate ? getDaysUntil(interviewDate) : null;

  return (
    <div className="prep-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={14} className="text-amber-400" />
        <span className="section-title mb-0 pb-0 border-0">
          Interview Countdown
        </span>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div
          className={`text-5xl font-extrabold stat-num ${daysLeft === null ? "text-muted-foreground" : daysLeft <= 7 ? "text-red-400" : daysLeft <= 14 ? "text-amber-400" : "text-emerald-400"}`}
        >
          {daysLeft === null ? "—" : daysLeft === 0 ? "🎯" : `${daysLeft}d`}
        </div>
        <div className="flex-1 space-y-2">
          <div className="text-sm text-muted-foreground">
            {daysLeft === null
              ? "Set your interview date to track your countdown."
              : daysLeft === 0
                ? "Today is the day! You've got this."
                : daysLeft <= 7
                  ? `${daysLeft} days left — final sprint mode!`
                  : `${daysLeft} days remaining — stay consistent.`}
          </div>
          <input
            type="date"
            value={interviewDate ?? ""}
            onChange={e => setInterviewDate(e.target.value || null)}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>
    </div>
  );
}

// ── Prep Timeline ──────────────────────────────────────────────────────────
function PrepTimeline() {
  const [interviewDate] = useInterviewDate();
  const [mode, setMode] = useState<"standard" | "fast" | "10week">("standard");

  const timeline =
    mode === "fast"
      ? FAST_TRACK_TIMELINE
      : mode === "10week"
        ? TEN_WEEK_TIMELINE
        : PREP_TIMELINE;

  const currentWeek = (() => {
    if (!interviewDate) return -1;
    const days = getDaysUntil(interviewDate);
    if (mode === "fast") {
      if (days > 7) return 0;
      return 1;
    }
    if (mode === "10week") {
      if (days > 63) return 0;
      if (days > 56) return 1;
      if (days > 49) return 2;
      if (days > 42) return 3;
      if (days > 35) return 4;
      if (days > 28) return 5;
      if (days > 21) return 6;
      if (days > 14) return 7;
      if (days > 7) return 8;
      return 9;
    }
    if (days > 21) return 0;
    if (days > 14) return 1;
    if (days > 7) return 2;
    return 3;
  })();

  const accentColor =
    mode === "fast" ? "orange" : mode === "10week" ? "emerald" : "blue";
  const totalLabel =
    mode === "fast" ? "2 weeks" : mode === "10week" ? "10 weeks" : "4 weeks";

  return (
    <div className="prep-card p-5">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="section-title mb-0 pb-0 border-0">Prep Timeline</div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary border border-border">
          <button
            onClick={() => setMode("standard")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              mode === "standard"
                ? "bg-blue-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            4-Week
          </button>
          <button
            onClick={() => setMode("fast")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              mode === "fast"
                ? "bg-orange-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ⚡ 2-Week
          </button>
          <button
            onClick={() => setMode("10week")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              mode === "10week"
                ? "bg-emerald-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🗓️ 10-Week
          </button>
        </div>
      </div>

      {/* Mode-specific warnings */}
      {mode === "fast" && (
        <div className="mb-3 p-3 rounded-lg border border-orange-500/30 bg-orange-500/5 text-xs text-orange-300">
          <span className="font-semibold text-orange-400">⚠️ Fast-Track: </span>
          Requires 3–4 hours of focused daily practice. Best for candidates with
          strong CS fundamentals who need to sharpen interview-specific skills
          quickly.
        </div>
      )}
      {mode === "10week" && (
        <div className="mb-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-300">
          <span className="font-semibold text-emerald-400">
            🗓️ Comprehensive Plan:{" "}
          </span>
          Ideal for candidates with 10+ weeks before their interview. Builds
          deep mastery with time for multiple full mock days and weak-spot
          elimination. Requires ~2 hours/day.
        </div>
      )}

      {/* Week cards */}
      <div className="space-y-3">
        {timeline.map((week, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border transition-all ${
              i === currentWeek
                ? mode === "fast"
                  ? "border-orange-500/40 bg-orange-500/5"
                  : mode === "10week"
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-blue-500/40 bg-blue-500/5"
                : "border-border bg-secondary/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold text-foreground">
                {week.week}
              </span>
              <span
                className={`badge ${
                  i === currentWeek
                    ? mode === "fast"
                      ? "badge-orange"
                      : mode === "10week"
                        ? "badge-green"
                        : "badge-blue"
                    : "badge-gray"
                }`}
              >
                {week.focus}
              </span>
              {i === currentWeek && (
                <span
                  className={`badge text-xs ${
                    mode === "fast"
                      ? "badge-orange"
                      : mode === "10week"
                        ? "badge-green"
                        : "badge-blue"
                  }`}
                >
                  ← You are here
                </span>
              )}
            </div>
            <ul className="space-y-1">
              {week.items.map((item, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span
                    className={`mt-0.5 ${
                      mode === "fast"
                        ? "text-orange-400"
                        : mode === "10week"
                          ? "text-emerald-400"
                          : "text-blue-400"
                    }`}
                  >
                    ·
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Total:{" "}
          <span className="font-semibold text-foreground">{totalLabel}</span> to
          interview-ready
        </span>
        {interviewDate && (
          <span>
            Interview in{" "}
            <span className="font-semibold text-foreground">
              {getDaysUntil(interviewDate)} days
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

// ── STAR Story Bank ───────────────────────────────────────────────────────────────────────────────────────
function StarStoryBank() {
  const [notes, setNotes] = useStarNotes();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("STAR template copied!");
  };

  const exportCheatSheet = () => {
    const lines: string[] = [
      "# STAR Story Cheat Sheet",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "---",
      "",
    ];
    STAR_STORIES.forEach((story, i) => {
      lines.push(`## ${i + 1}. ${story.title}`);
      lines.push(`**Tags:** ${story.tags.join(" · ")}`);
      lines.push("");
      lines.push(story.template);
      const personalNotes = notes[story.id];
      if (personalNotes && personalNotes.trim()) {
        lines.push("");
        lines.push(`**My Notes:** ${personalNotes.trim()}`);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "star_cheat_sheet.md";
    a.click();
    toast.success("STAR cheat sheet downloaded!");
  };

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="section-title mb-0 pb-0 border-0 flex items-center gap-2">
          <Brain size={14} className="text-purple-400" />
          STAR Story Bank
        </div>
        <button
          onClick={exportCheatSheet}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 text-xs font-semibold transition-all"
          title="Download all stories as a Markdown cheat sheet"
        >
          <Download size={11} /> Export Cheat Sheet
        </button>
      </div>
      <div className="space-y-2">
        {STAR_STORIES.map(story => (
          <div
            key={story.id}
            className="rounded-lg border border-border overflow-hidden"
          >
            <button
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-all"
              onClick={() =>
                setExpanded(expanded === story.id ? null : story.id)
              }
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">
                    {story.title}
                  </span>
                  {story.tags.map(t => (
                    <span key={t} className="badge badge-purple text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {expanded === story.id ? (
                <ChevronUp
                  size={13}
                  className="text-muted-foreground shrink-0"
                />
              ) : (
                <ChevronDown
                  size={13}
                  className="text-muted-foreground shrink-0"
                />
              )}
            </button>
            {expanded === story.id && (
              <div className="p-3 border-t border-border space-y-3">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-secondary p-3 rounded-lg">
                  {story.template}
                </pre>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(story.id, story.template)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-xs font-semibold text-muted-foreground transition-all"
                  >
                    {copied === story.id ? (
                      <Check size={11} className="text-emerald-400" />
                    ) : (
                      <Copy size={11} />
                    )}
                    {copied === story.id ? "Copied!" : "Copy template"}
                  </button>
                </div>
                <textarea
                  value={notes[story.id] ?? ""}
                  onChange={e =>
                    setNotes(n => ({ ...n, [story.id]: e.target.value }))
                  }
                  placeholder="Add your personal story notes here…"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Progress Export ────────────────────────────────────────────────────────
function ProgressExport() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [mockHistory] = useMockHistory();
  const streak = useStreak();
  const [exporting, setExporting] = useState(false);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const masteredPatterns = PATTERNS.filter(
        p => (patternRatings[p.id] ?? 0) >= 4
      );
      const weakPatterns = PATTERNS.filter(p => {
        const r = patternRatings[p.id] ?? 0;
        return r > 0 && r <= 2;
      });
      const readyStories = BEHAVIORAL_QUESTIONS.filter(
        q => (bqRatings[q.id] ?? 0) >= 4
      );
      const overallPct = Math.round(
        ((masteredPatterns.length / PATTERNS.length) * 0.6 +
          (readyStories.length / BEHAVIORAL_QUESTIONS.length) * 0.4) *
          100
      );

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Engineering Interview Prep — Readiness Report", 14, 18);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(
        `Overall Readiness: ${overallPct}%  |  Streak: ${streak.currentStreak} days (best: ${streak.longestStreak})`,
        14,
        35
      );

      let y = 50;
      const section = (title: string) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFillColor(30, 41, 59);
        doc.rect(10, y - 4, 190, 8, "F");
        doc.setTextColor(59, 130, 246);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, y + 1);
        y += 10;
      };
      const line = (
        text: string,
        color: [number, number, number] = [203, 213, 225]
      ) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setTextColor(...color);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.text(text, 16, y);
        y += 6;
      };

      section(
        `Patterns Mastered (${masteredPatterns.length}/${PATTERNS.length})`
      );
      if (masteredPatterns.length === 0) line("None mastered yet");
      else
        masteredPatterns.forEach(p =>
          line(
            `★${patternRatings[p.id]}  ${p.name}  [${p.diff}]`,
            [134, 239, 172]
          )
        );

      y += 4;
      section(`Weak Patterns (${weakPatterns.length})`);
      if (weakPatterns.length === 0) line("No weak patterns — great!");
      else
        weakPatterns.forEach(p =>
          line(
            `★${patternRatings[p.id]}  ${p.name}  [${p.diff}]`,
            [252, 165, 165]
          )
        );

      y += 4;
      section(
        `Behavioral Stories Ready (${readyStories.length}/${BEHAVIORAL_QUESTIONS.length})`
      );
      if (readyStories.length === 0) line("No stories rated 4+ yet");
      else
        readyStories.forEach(q =>
          line(
            `★${bqRatings[q.id]}  [${q.area}]  ${q.q.slice(0, 70)}…`,
            [167, 243, 208]
          )
        );

      y += 4;
      section(`Mock Session History (${mockHistory.length} sessions)`);
      if (mockHistory.length === 0) line("No mock sessions completed yet");
      else
        mockHistory
          .slice(-10)
          .forEach(m =>
            line(
              `${new Date(m.date).toLocaleDateString()}  avg ★${m.avgScore.toFixed(1)}`,
              [203, 213, 225]
            )
          );

      doc.save("meta_prep_readiness_report.pdf");
      toast.success("PDF report downloaded!");
    } catch (e) {
      toast.error("PDF export failed — try the .txt export instead");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const exportTxt = () => {
    const masteredPatterns = PATTERNS.filter(
      p => (patternRatings[p.id] ?? 0) >= 4
    );
    const weakPatterns = PATTERNS.filter(p => {
      const r = patternRatings[p.id] ?? 0;
      return r > 0 && r <= 2;
    });
    const readyStories = BEHAVIORAL_QUESTIONS.filter(
      q => (bqRatings[q.id] ?? 0) >= 4
    );
    const overallPct = Math.round(
      ((masteredPatterns.length / PATTERNS.length) * 0.6 +
        (readyStories.length / BEHAVIORAL_QUESTIONS.length) * 0.4) *
        100
    );

    const lines = [
      "META INTERVIEW PREP — PROGRESS REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      "=".repeat(50),
      `Overall Readiness: ${overallPct}%`,
      `Current Streak: ${streak.currentStreak} days (best: ${streak.longestStreak})`,
      "",
      `PATTERNS MASTERED (${masteredPatterns.length}/${PATTERNS.length}):`,
      ...masteredPatterns.map(p => `  ★${patternRatings[p.id]} ${p.name}`),
      "",
      `WEAK PATTERNS (${weakPatterns.length}):`,
      ...weakPatterns.map(p => `  ★${patternRatings[p.id]} ${p.name}`),
      "",
      `BEHAVIORAL STORIES READY (${readyStories.length}/${BEHAVIORAL_QUESTIONS.length}):`,
      ...readyStories.map(
        q => `  ★${bqRatings[q.id]} [${q.area}] ${q.q.slice(0, 60)}…`
      ),
      "",
      `MOCK SESSION HISTORY (${mockHistory.length} sessions):`,
      ...mockHistory.map(
        m =>
          `  ${new Date(m.date).toLocaleDateString()} — avg ★${m.avgScore.toFixed(1)}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "meta_prep_progress.txt";
    a.click();
    toast.success("Progress report downloaded!");
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={exportPDF}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-all disabled:opacity-50"
      >
        <Download size={13} />{" "}
        {exporting ? "Generating PDF…" : "Export Readiness Report (.pdf)"}
      </button>
      <button
        onClick={exportTxt}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary hover:bg-accent border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
      >
        <Download size={13} /> Export Progress Report (.txt)
      </button>
    </div>
  );
}

// ── Share Prep State URL ──────────────────────────────────────────────────
function SharePrepState() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [interviewDate] = useInterviewDate();
  const [copied, setCopied] = useState(false);

  const generateShareUrl = () => {
    const masteredPatterns = PATTERNS.filter(
      p => (patternRatings[p.id] ?? 0) >= 4
    ).map(p => p.id);
    const readyStories = BEHAVIORAL_QUESTIONS.filter(
      q => (bqRatings[q.id] ?? 0) >= 4
    ).map(q => q.id);
    const overallPct = Math.round(
      ((masteredPatterns.length / PATTERNS.length) * 0.6 +
        (readyStories.length / BEHAVIORAL_QUESTIONS.length) * 0.4) *
        100
    );
    const params = new URLSearchParams();
    params.set("tab", "overview");
    params.set("shared", "1");
    params.set("readiness", String(overallPct));
    params.set("patterns", String(masteredPatterns.length));
    params.set("stories", String(readyStories.length));
    if (interviewDate) params.set("date", interviewDate);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleCopy = () => {
    const url = generateShareUrl();
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        toast.success("Share URL copied to clipboard!");
      })
      .catch(() => toast.error("Could not copy — try manually"));
  };

  const masteredCount = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) >= 4
  ).length;
  const readyCount = BEHAVIORAL_QUESTIONS.filter(
    q => (bqRatings[q.id] ?? 0) >= 4
  ).length;
  const overallPct = Math.round(
    ((masteredCount / PATTERNS.length) * 0.6 +
      (readyCount / BEHAVIORAL_QUESTIONS.length) * 0.4) *
      100
  );

  return (
    <div className="prep-card p-5">
      <div className="section-title">Share Your Prep Progress</div>
      <div className="text-xs text-muted-foreground mb-4">
        Generate a shareable URL that encodes your readiness snapshot. Your
        actual ratings are not included — only the summary stats.
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
          <div className="text-lg font-black text-blue-400">{overallPct}%</div>
          <div className="text-[10px] text-muted-foreground">
            Overall Readiness
          </div>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
          <div className="text-lg font-black text-emerald-400">
            {masteredCount}/{PATTERNS.length}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Patterns Mastered
          </div>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
          <div className="text-lg font-black text-amber-400">
            {readyCount}/{BEHAVIORAL_QUESTIONS.length}
          </div>
          <div className="text-[10px] text-muted-foreground">Stories Ready</div>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          readOnly
          value={generateShareUrl()}
          className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-muted-foreground font-mono focus:outline-none focus:border-blue-500/50 truncate"
        />
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
            copied
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
              : "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-400"
          }`}
        >
          {copied ? (
            <>
              <Check size={12} /> Copied!
            </>
          ) : (
            <>
              <Copy size={12} /> Copy URL
            </>
          )}
        </button>
      </div>
      <div className="mt-3 text-[10px] text-muted-foreground">
        Tip: Share this link with your prep partner or mentor to show your
        current readiness snapshot.
      </div>
    </div>
  );
}

// ── Interview Day Checklist ────────────────────────────────────────────────
function InterviewDayChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setChecked(c => ({ ...c, [key]: !c[key] }));

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-title mb-0 pb-0 border-0">
          Interview Day Checklist
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-xs font-semibold text-muted-foreground transition-all"
        >
          <Printer size={11} /> Print
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INTERVIEW_DAY_CHECKLIST.map(phase => (
          <div key={phase.phase}>
            <div className="text-xs font-bold text-foreground mb-2">
              {phase.phase}
            </div>
            <div className="space-y-1.5">
              {phase.items.map((item, i) => {
                const key = `${phase.phase}-${i}`;
                return (
                  <label
                    key={key}
                    className="flex items-start gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={checked[key] ?? false}
                      onChange={() => toggle(key)}
                      className="mt-0.5 accent-blue-500 shrink-0"
                    />
                    <span
                      className={`text-xs transition-colors ${checked[key] ? "line-through text-muted-foreground/50" : "text-muted-foreground group-hover:text-foreground"}`}
                    >
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Resources ──────────────────────────────────────────────────────────────
function ResourcesSection() {
  const TAG_COLORS: Record<string, string> = {
    Coding: "badge-blue",
    "System Design": "badge-purple",
    Behavioral: "badge-amber",
  };
  return (
    <div className="prep-card p-5">
      <div className="section-title">Curated Resources</div>
      <div className="space-y-2">
        {RESOURCES.map(r => (
          <a
            key={r.title}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary hover:bg-accent border border-border transition-all group"
          >
            <span
              className={`badge ${TAG_COLORS[r.tag] ?? "badge-gray"} shrink-0 mt-0.5`}
            >
              {r.tag}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                {r.title}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {r.desc}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Main OverviewTab ───────────────────────────────────────────────────────
// ── Readiness Goal Setter ──────────────────────────────────────────────
function ReadinessGoalSetter() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [goal, setGoal] = useReadinessGoal();
  const [editing, setEditing] = useState(!goal);
  const [inputPct, setInputPct] = useState(goal?.targetPct ?? 80);
  const [inputDate, setInputDate] = useState(goal?.targetDate ?? "");

  const masteredPatterns = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) >= 4
  ).length;
  const readyStories = BEHAVIORAL_QUESTIONS.filter(
    q => (bqRatings[q.id] ?? 0) >= 4
  ).length;
  const currentPct = Math.round(
    ((masteredPatterns / PATTERNS.length) * 0.6 +
      (readyStories / BEHAVIORAL_QUESTIONS.length) * 0.4) *
      100
  );

  const saveGoal = () => {
    if (!inputDate) {
      toast.error("Please set a target date.");
      return;
    }
    if (inputPct < 1 || inputPct > 100) {
      toast.error("Target must be between 1 and 100.");
      return;
    }
    setGoal({ targetPct: inputPct, targetDate: inputDate });
    setEditing(false);
    toast.success("Goal saved!");
  };

  const daysLeft = goal
    ? Math.max(
        0,
        Math.ceil(
          (new Date(goal.targetDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // Daily tasks needed
  const pctGap = goal ? Math.max(0, goal.targetPct - currentPct) : 0;
  const totalPatterns = PATTERNS.length;
  const totalStories = BEHAVIORAL_QUESTIONS.length;
  const patternsNeeded = Math.max(
    0,
    Math.ceil((((goal?.targetPct ?? 0) / 100) * totalPatterns) / 0.6) -
      masteredPatterns
  );
  const storiesNeeded = Math.max(
    0,
    Math.ceil((((goal?.targetPct ?? 0) / 100) * totalStories) / 0.4) -
      readyStories
  );
  const patternsPerDay =
    daysLeft > 0 ? (patternsNeeded / daysLeft).toFixed(1) : "0";
  const storiesPerDay =
    daysLeft > 0 ? (storiesNeeded / daysLeft).toFixed(1) : "0";
  const onTrack = pctGap <= 0;

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-blue-400" />
          <span className="text-sm font-bold text-foreground">
            Readiness Goal
          </span>
          {goal && !editing && (
            <span
              className={`badge ${onTrack ? "badge-green" : "badge-amber"}`}
            >
              {onTrack ? "✅ On Track" : `⚠️ ${daysLeft}d left`}
            </span>
          )}
        </div>
        {goal && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Target Readiness %
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={inputPct}
                onChange={e => setInputPct(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={inputDate}
                onChange={e => setInputDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveGoal}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all"
            >
              Save Goal
            </button>
            {goal && (
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : goal ? (
        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                Current:{" "}
                <span className="font-bold text-foreground">{currentPct}%</span>
              </span>
              <span className="text-muted-foreground">
                Goal:{" "}
                <span className="font-bold text-blue-400">
                  {goal.targetPct}%
                </span>{" "}
                by {new Date(goal.targetDate).toLocaleDateString()}
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${onTrack ? "bg-emerald-500" : "bg-blue-500"}`}
                style={{
                  width: `${Math.min(100, (currentPct / goal.targetPct) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Daily task card */}
          {!onTrack && daysLeft > 0 && (
            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <div className="text-xs font-bold text-amber-400 mb-2">
                📅 Daily Task Card — {daysLeft} days to goal
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2.5 rounded-lg bg-secondary">
                  <div className="text-lg font-extrabold text-blue-400">
                    {patternsPerDay}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    patterns/day
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {patternsNeeded} remaining
                  </div>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-secondary">
                  <div className="text-lg font-extrabold text-purple-400">
                    {storiesPerDay}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    stories/day
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {storiesNeeded} remaining
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-center">
                Gap: {pctGap}% · {patternsNeeded} patterns + {storiesNeeded}{" "}
                stories to reach {goal.targetPct}%
              </div>
            </div>
          )}

          {onTrack && (
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-center">
              <div className="text-sm font-bold text-emerald-400">
                🎉 Goal reached! You're at {currentPct}% — above your{" "}
                {goal.targetPct}% target.
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Consider raising your goal to keep pushing.
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── Weekly Progress Digest ─────────────────────────────────────────────────
function WeeklyDigest() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [mockHistory] = useMockHistory();
  const [trend] = useReadinessTrend();
  const streak = useStreak();
  const [ctciStreak] = useCTCIStreak();

  const notifyMutation = trpc.system.notifyOwner.useMutation({
    onSuccess: data => {
      if (data.success)
        toast.success("Weekly digest sent! Check your Manus notifications.");
      else toast.error("Digest queued but delivery failed. Try again later.");
    },
    onError: () =>
      toast.error(
        "Could not send digest. Make sure you are logged in as the app owner."
      ),
  });

  const sendDigest = () => {
    const masteredPatterns = PATTERNS.filter(
      p => (patternRatings[p.id] ?? 0) >= 4
    );
    const weakPatterns = PATTERNS.filter(p => {
      const r = patternRatings[p.id] ?? 0;
      return r > 0 && r <= 2;
    });
    const readyStories = BEHAVIORAL_QUESTIONS.filter(
      q => (bqRatings[q.id] ?? 0) >= 4
    );
    const overallPct = Math.round(
      ((masteredPatterns.length / PATTERNS.length) * 0.6 +
        (readyStories.length / BEHAVIORAL_QUESTIONS.length) * 0.4) *
        100
    );

    // Compute 7-day readiness delta from trend snapshots
    const sortedTrend = [...trend].sort((a, b) => a.date.localeCompare(b.date));
    const recentTrend = sortedTrend.slice(-7);
    const trendDelta =
      recentTrend.length >= 2 ? overallPct - recentTrend[0].pct : 0;

    // Mock sessions this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekMocks = mockHistory.filter(m => new Date(m.date) >= oneWeekAgo);
    const weekAvgMock = weekMocks.length
      ? (
          weekMocks.reduce((s, m) => s + m.avgScore, 0) / weekMocks.length
        ).toFixed(1)
      : "—";

    const ctciSolvedCount = (() => {
      try {
        return Object.values(
          JSON.parse(localStorage.getItem("ctci_solved") ?? "{}")
        ).filter(Boolean).length;
      } catch {
        return 0;
      }
    })() as number;

    const title = `📊 Meta Prep Weekly Digest — ${new Date().toLocaleDateString()}`;
    const content = [
      `**Overall Readiness: ${overallPct}%** (${trendDelta >= 0 ? "+" : ""}${trendDelta}% this week)`,
      "",
      `📅 **Streak:** ${streak.currentStreak} days (best: ${streak.longestStreak})`,
      `🔥 **CTCI Daily Streak:** ${ctciStreak.currentStreak} days · ${ctciStreak.totalSolved} daily challenges solved`,
      `💻 **CTCI Total Solved:** ${ctciSolvedCount}/500`,
      "",
      `✅ **Patterns Mastered:** ${masteredPatterns.length}/${PATTERNS.length}`,
      masteredPatterns.length > 0
        ? masteredPatterns
            .slice(-5)
            .map(p => `  - ★${patternRatings[p.id]} ${p.name}`)
            .join("\n")
        : "  (none yet)",
      "",
      `⚠️ **Weak Patterns (★1-2):** ${weakPatterns.length}`,
      weakPatterns
        .slice(0, 5)
        .map(p => `  - ★${patternRatings[p.id]} ${p.name}`)
        .join("\n"),
      "",
      `🗣️ **Behavioral Stories Ready:** ${readyStories.length}/${BEHAVIORAL_QUESTIONS.length}`,
      "",
      `🎭 **Mock Sessions This Week:** ${weekMocks.length} (avg ★${weekAvgMock})`,
      weekMocks
        .slice(-3)
        .map(
          m =>
            `  - ${new Date(m.date).toLocaleDateString()} avg ★${m.avgScore.toFixed(1)}`
        )
        .join("\n"),
    ]
      .filter(l => l !== undefined)
      .join("\n");

    notifyMutation.mutate({ title, content });
  };

  const overallPct = Math.round(
    ((PATTERNS.filter(p => (patternRatings[p.id] ?? 0) >= 4).length /
      PATTERNS.length) *
      0.6 +
      (BEHAVIORAL_QUESTIONS.filter(q => (bqRatings[q.id] ?? 0) >= 4).length /
        BEHAVIORAL_QUESTIONS.length) *
        0.4) *
      100
  );

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="section-title mb-0 pb-0 border-0">
            Weekly Progress Digest
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Send a formatted summary to your Manus notifications
          </div>
        </div>
        <button
          onClick={sendDigest}
          disabled={notifyMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-all"
        >
          <Send size={13} />
          {notifyMutation.isPending ? "Sending…" : "Send Weekly Digest"}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-secondary text-center">
          <div className="text-lg font-extrabold text-blue-400">
            {overallPct}%
          </div>
          <div className="text-xs text-muted-foreground">Readiness</div>
        </div>
        <div className="p-3 rounded-lg bg-secondary text-center">
          <div className="text-lg font-extrabold text-orange-400">
            {streak.currentStreak}d
          </div>
          <div className="text-xs text-muted-foreground">Study Streak</div>
        </div>
        <div className="p-3 rounded-lg bg-secondary text-center">
          <div className="text-lg font-extrabold text-purple-400">
            {ctciStreak.currentStreak}d
          </div>
          <div className="text-xs text-muted-foreground">CTCI Streak</div>
        </div>
        <div className="p-3 rounded-lg bg-secondary text-center">
          <div className="text-lg font-extrabold text-emerald-400">
            {mockHistory.length}
          </div>
          <div className="text-xs text-muted-foreground">Mock Sessions</div>
        </div>
      </div>
    </div>
  );
}

// ── Most-Hinted Patterns Badge ─────────────────────────────────────────────
function MostHintedBadge() {
  const [hintAnalytics] = useHintAnalytics();

  const entries = Object.entries(hintAnalytics)
    .map(([id, counts]) => ({
      id,
      name: PATTERNS.find(p => p.id === id)?.name ?? id,
      total: (counts.gentle ?? 0) + (counts.medium ?? 0) + (counts.full ?? 0),
      gentle: counts.gentle ?? 0,
      medium: counts.medium ?? 0,
      full: counts.full ?? 0,
    }))
    .filter(e => e.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  if (entries.length === 0) return null;

  const maxTotal = entries[0].total;

  return (
    <div className="prep-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={14} className="text-orange-400" />
        <span className="text-sm font-bold text-foreground">
          Hint Usage Analytics
        </span>
        <span className="badge badge-amber text-xs">Most-Hinted Patterns</span>
      </div>
      <div className="text-xs text-muted-foreground mb-4">
        Patterns where you've used the Stuck? hint ladder most — these need the
        most dedicated practice.
      </div>
      <div className="space-y-2">
        {entries.map((e, i) => (
          <div key={e.id} className="flex items-center gap-3">
            <span
              className={`text-xs font-bold w-5 text-center ${
                i === 0
                  ? "text-amber-400"
                  : i === 1
                    ? "text-slate-300"
                    : i === 2
                      ? "text-orange-600"
                      : "text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground truncate">
                  {e.name}
                </span>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                  {e.total} hints
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${(e.total / maxTotal) * 100}%` }}
                />
              </div>
              <div className="flex gap-2 mt-1">
                {e.gentle > 0 && (
                  <span className="text-[10px] text-emerald-400">
                    💡 {e.gentle}×
                  </span>
                )}
                {e.medium > 0 && (
                  <span className="text-[10px] text-amber-400">
                    🔍 {e.medium}×
                  </span>
                )}
                {e.full > 0 && (
                  <span className="text-[10px] text-red-400">📖 {e.full}×</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border flex gap-4 text-[10px] text-muted-foreground">
        <span>💡 Gentle hint</span>
        <span>🔍 Medium hint</span>
        <span>📖 Full walkthrough</span>
      </div>
    </div>
  );
}

//// ── Study Session Planner ─────────────────────────────────────────────────
const STUDY_PLAN_HISTORY_KEY = "study_plan_history_v1";
type StudyPlanRecord = {
  date: string;
  durationMins: string;
  icTarget: string;
  headline: string;
  plan?: {
    headline: string;
    blocks: {
      emoji: string;
      title: string;
      durationMins: number;
      tasks: string[];
    }[];
    tip: string;
    warningIfAny: string | null;
  };
};
function loadStudyPlanHistory(): StudyPlanRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STUDY_PLAN_HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function StudySessionPlanner() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [hintAnalytics] = useHintAnalytics();
  const [interviewDate] = useInterviewDate();
  const [duration, setDuration] = useState<"30" | "60" | "90">("60");
  const [icTarget, setIcTarget] = useState<"L5" | "L6" | "L7">("L6");

  // Auto-restore today's plan if one exists
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecord = (() => {
    const h = loadStudyPlanHistory();
    const rec = h.length ? h[h.length - 1] : null;
    return rec?.date === todayStr && rec.plan ? rec : null;
  })();

  const [plan, setPlan] = useState<{
    headline: string;
    blocks: {
      emoji: string;
      title: string;
      durationMins: number;
      tasks: string[];
    }[];
    tip: string;
    warningIfAny: string | null;
  } | null>(todayRecord?.plan ?? null);
  const lastPlan = (() => {
    const h = loadStudyPlanHistory();
    return h.length ? h[h.length - 1] : null;
  })();
  const planMutation = trpc.ctci.studyPlan.useMutation({
    onSuccess: data => {
      setPlan(data);
      try {
        const history = loadStudyPlanHistory();
        history.push({
          date: new Date().toISOString().split("T")[0],
          durationMins: duration,
          icTarget,
          headline: data.headline,
          plan: data,
        });
        localStorage.setItem(
          STUDY_PLAN_HISTORY_KEY,
          JSON.stringify(history.slice(-20))
        );
      } catch {
        /* ignore */
      }
    },
    onError: () => toast.error("Could not generate plan. Try again."),
  });

  const generatePlan = () => {
    const srDuePatterns = PATTERNS.filter(p => {
      const r = patternRatings[p.id] ?? 0;
      return r > 0 && r < 5;
    })
      .slice(0, 10)
      .map(p => p.name);
    const srDueBehavioral = BEHAVIORAL_QUESTIONS.filter(
      q => (bqRatings[q.id] ?? 0) < 4
    )
      .slice(0, 5)
      .map(q => q.q.slice(0, 60));
    const mostHintedPatterns = Object.entries(hintAnalytics)
      .map(([id, c]) => ({
        id,
        total: (c.gentle ?? 0) + (c.medium ?? 0) + (c.full ?? 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map(e => PATTERNS.find(p => p.id === e.id)?.name ?? e.id);
    const weakPatterns = PATTERNS.filter(p => {
      const r = patternRatings[p.id] ?? 0;
      return r > 0 && r <= 2;
    })
      .map(p => p.name)
      .slice(0, 5);
    const ctciUnsolved = (() => {
      try {
        return (
          500 -
          Object.values(
            JSON.parse(localStorage.getItem("ctci_solved") ?? "{}")
          ).filter(Boolean).length
        );
      } catch {
        return 500;
      }
    })() as number;
    const daysToInterview = interviewDate
      ? getDaysUntil(interviewDate)
      : undefined;
    const overallPct = Math.round(
      ((PATTERNS.filter(p => (patternRatings[p.id] ?? 0) >= 4).length /
        PATTERNS.length) *
        0.6 +
        (BEHAVIORAL_QUESTIONS.filter(q => (bqRatings[q.id] ?? 0) >= 4).length /
          BEHAVIORAL_QUESTIONS.length) *
          0.4) *
        100
    );

    planMutation.mutate({
      durationMins: duration,
      icTarget,
      readinessPct: overallPct,
      srDuePatterns,
      srDueBehavioral,
      mostHintedPatterns,
      weakPatterns,
      ctciUnsolved,
      daysToInterview:
        daysToInterview !== undefined && daysToInterview > 0
          ? daysToInterview
          : undefined,
    });
  };

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="section-title mb-0 pb-0 border-0">
            🗓️ AI Study Session Planner
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <div className="text-xs text-muted-foreground">
              Get a personalised, time-boxed plan based on your current gaps
            </div>
            {lastPlan && !plan && !planMutation.isPending && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 font-medium whitespace-nowrap">
                Last plan: {lastPlan.date.slice(5).replace("-", "/")} ·{" "}
                {lastPlan.durationMins}m · {lastPlan.icTarget}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {(["30", "60", "90"] as const).map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all ${
                  duration === d
                    ? "bg-blue-500/20 border-blue-400 text-blue-300"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(["L5", "L6", "L7"] as const).map(ic => (
              <button
                key={ic}
                onClick={() => setIcTarget(ic)}
                className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all ${
                  icTarget === ic
                    ? "bg-purple-500/20 border-purple-400 text-purple-300"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
          <button
            onClick={generatePlan}
            disabled={planMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-all"
          >
            <Brain size={13} />
            {planMutation.isPending ? "Planning…" : "Plan Today's Session"}
          </button>
        </div>
      </div>

      {!plan && !planMutation.isPending && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-3xl mb-2">🧠</div>
          <div className="text-sm">
            Click "Plan Today's Session" to get a personalised study plan
          </div>
          <div className="text-xs mt-1 opacity-70">
            Uses your SR due dates, hint history, weak patterns, and readiness
            goal
          </div>
        </div>
      )}

      {planMutation.isPending && (
        <div className="text-center py-8">
          <div className="text-2xl mb-2 animate-pulse">⏳</div>
          <div className="text-sm text-muted-foreground">
            Analysing your prep data…
          </div>
        </div>
      )}

      {plan && (
        <div className="space-y-4">
          {plan.warningIfAny && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-sm">⚠️</span>
              <span className="text-xs text-red-300">{plan.warningIfAny}</span>
            </div>
          )}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-sm font-semibold text-emerald-300">
              🎯 {plan.headline}
            </span>
          </div>
          <div className="space-y-3">
            {plan.blocks.map((block, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-secondary border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">
                    {block.emoji} {block.title}
                  </span>
                  <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                    {block.durationMins} min
                  </span>
                </div>
                <ul className="space-y-1">
                  {block.tasks.map((task, j) => (
                    <li
                      key={j}
                      className="text-xs text-muted-foreground flex items-start gap-1.5"
                    >
                      <span className="text-emerald-500 mt-0.5 shrink-0">
                        ›
                      </span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {plan.tip && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="text-sm">💡</span>
              <span className="text-xs text-blue-300">{plan.tip}</span>
            </div>
          )}
          <button
            onClick={() => setPlan(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ↺ Generate new plan
          </button>
        </div>
      )}
    </div>
  );
}

// ── CTCI Divergence Report ─────────────────────────────────────────────────
function CTCIDivergenceReport() {
  const [diffEstimates] = useCTCIDifficultyEstimates();
  const [expanded, setExpanded] = useState(false);

  const SELF_IDX: Record<string, number> = {
    Easy: 0,
    Medium: 1,
    Hard: 2,
    "Very Hard": 3,
  };
  const OFF_IDX: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

  const divergences = CTCI_QUESTIONS.filter(q => diffEstimates[q.num])
    .map(q => {
      const self = diffEstimates[q.num].selfRating;
      const official = q.difficulty;
      const gap = SELF_IDX[self] - OFF_IDX[official];
      return { ...q, selfRating: self, gap };
    })
    .filter(q => q.gap !== 0)
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

  const harder = divergences.filter(q => q.gap > 0);
  const easier = divergences.filter(q => q.gap < 0);

  if (Object.keys(diffEstimates).length === 0) {
    return (
      <div className="prep-card p-5">
        <div className="section-title">
          <span className="text-pink-400">📊</span> CTCI Difficulty Divergence
          Report
        </div>
        <div className="text-center py-6 text-muted-foreground text-sm">
          <div className="text-3xl mb-2">🔍</div>
          <div>No self-assessments yet.</div>
          <div className="text-xs mt-1">
            Rate problem difficulty in the Coding tab to see your calibration
            report.
          </div>
        </div>
      </div>
    );
  }

  const total = Object.keys(diffEstimates).length;
  const diverged = divergences.length;
  const calibrationPct = Math.round(((total - diverged) / total) * 100);

  return (
    <div className="prep-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-pink-400 text-lg">📊</span>
          <div>
            <div className="text-sm font-bold text-foreground">
              CTCI Difficulty Divergence Report
            </div>
            <div className="text-xs text-muted-foreground">
              {total} problems rated · {calibrationPct}% calibration accuracy
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Summary bar */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-xl font-black text-emerald-400 stat-num">
            {total - diverged}
          </div>
          <div className="text-xs text-muted-foreground">Calibrated</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="text-xl font-black text-orange-400 stat-num">
            {harder.length}
          </div>
          <div className="text-xs text-muted-foreground">
            Harder than expected
          </div>
        </div>
        <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="text-xl font-black text-blue-400 stat-num">
            {easier.length}
          </div>
          <div className="text-xs text-muted-foreground">
            Easier than expected
          </div>
        </div>
      </div>

      {/* Calibration bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">Calibration</span>
          <span className="text-xs font-bold text-foreground">
            {calibrationPct}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${calibrationPct}%`,
              background:
                calibrationPct >= 80
                  ? "oklch(0.65 0.18 145)"
                  : calibrationPct >= 60
                    ? "oklch(0.78 0.17 75)"
                    : "oklch(0.65 0.22 25)",
            }}
          />
        </div>
      </div>

      {expanded && divergences.length > 0 && (
        <div className="border-t border-border divide-y divide-border">
          {harder.length > 0 && (
            <div className="p-4">
              <div className="text-xs font-bold text-orange-400 mb-2">
                ⚠️ Harder Than Expected — Focus Here
              </div>
              <div className="space-y-2">
                {harder.slice(0, 5).map(q => (
                  <div
                    key={q.num}
                    className="flex items-center gap-3 p-2 rounded-lg bg-orange-500/5 border border-orange-500/20"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-6">
                      #{q.num}
                    </span>
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-foreground hover:text-orange-400 flex-1 truncate transition-colors"
                    >
                      {q.name}
                    </a>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {q.difficulty} → {q.selfRating}
                    </span>
                    <div className="flex gap-0.5 shrink-0">
                      {Array.from({ length: q.gap }).map((_, i) => (
                        <span key={i} className="text-orange-400 text-xs">
                          ▲
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {easier.length > 0 && (
            <div className="p-4">
              <div className="text-xs font-bold text-blue-400 mb-2">
                💪 Easier Than Expected — Strong Areas
              </div>
              <div className="space-y-2">
                {easier.slice(0, 5).map(q => (
                  <div
                    key={q.num}
                    className="flex items-center gap-3 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-6">
                      #{q.num}
                    </span>
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-foreground hover:text-blue-400 flex-1 truncate transition-colors"
                    >
                      {q.name}
                    </a>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {q.difficulty} → {q.selfRating}
                    </span>
                    <div className="flex gap-0.5 shrink-0">
                      {Array.from({ length: Math.abs(q.gap) }).map((_, i) => (
                        <span key={i} className="text-blue-400 text-xs">
                          ▼
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {expanded && divergences.length === 0 && (
        <div className="p-4 text-center text-sm text-emerald-400">
          🎯 Perfect calibration! Your self-assessments match official
          difficulty on all rated problems.
        </div>
      )}
    </div>
  );
}

// ── Daily Drill Reminder ────────────────────────────────────────────────────
function DailyDrillButton() {
  const [history] = useAIReviewHistory();
  const [patternRatings] = usePatternRatings();

  // Aggregate average score per topic from AI review history
  const topicScores: Record<string, { total: number; count: number }> = {};
  history.forEach(r => {
    if (!topicScores[r.topic]) topicScores[r.topic] = { total: 0, count: 0 };
    topicScores[r.topic].total += r.score;
    topicScores[r.topic].count += 1;
  });

  // Also factor in pattern ratings (1-5 scale) for patterns with no AI reviews
  PATTERNS.forEach(p => {
    const rating = patternRatings[p.id] ?? 0;
    if (!topicScores[p.name]) {
      topicScores[p.name] = { total: rating, count: 1 };
    }
  });

  // Get 3 weakest topics (lowest avg score, min 1 review or rating)
  const sorted = Object.entries(topicScores)
    .map(([topic, { total, count }]) => ({ topic, avg: total / count }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);

  if (sorted.length === 0) return null;

  const handleClick = () => {
    const topicList = sorted
      .map((t, i) => `${i + 1}. ${t.topic} (avg ${t.avg.toFixed(1)}/5)`)
      .join("\n");
    toast.custom(
      () => (
        <div
          style={{
            background: "oklch(0.18 0.025 264)",
            border: "1px solid oklch(0.38 0.08 264)",
            color: "oklch(0.92 0.04 264)",
            borderRadius: "0.75rem",
            padding: "0.875rem 1rem",
            minWidth: "280px",
            maxWidth: "360px",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "oklch(0.75 0.18 264)",
            }}
          >
            🎯 3 Topics to Drill Today
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              opacity: 0.85,
              whiteSpace: "pre-line",
            }}
          >
            {topicList}
          </div>
          <div
            style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.25rem" }}
          >
            Head to the Code Practice tab → filter by these topics
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 text-xs font-semibold transition-all"
      title={`Weakest topics: ${sorted.map(t => t.topic).join(", ")}`}
    >
      <Target size={12} />3 Drills Due Today
    </button>
  );
}

const STREAK_MILESTONES: Record<number, string> = {
  7: "You're in the top 20% of prep consistency!",
  14: "Two weeks straight — elite-level discipline!",
  30: "30-day streak! You're in the top 5% of candidates.",
  60: "60 days of daily prep. L7 mindset unlocked. 🏆",
  100: "100-day streak. You're legendary. 🎖️",
};

function QuickActionsRow() {
  const streak = useStreak();
  const today = new Date().toISOString().split("T")[0];

  // Streak milestone toasts — fire once per milestone per day
  const [lastMilestoneDay, setLastMilestoneDay] = useState<string | null>(
    () => {
      try {
        return localStorage.getItem("streak_milestone_day");
      } catch {
        return null;
      }
    }
  );
  useEffect(() => {
    const milestone = STREAK_MILESTONES[streak.currentStreak];
    if (milestone && lastMilestoneDay !== today) {
      const tweetText = `🔥 ${streak.currentStreak}-day streak on my Meta IC${streak.currentStreak >= 30 ? 7 : 6} interview prep! ${milestone} #SoftwareEngineering #MetaInterview`;
      toast.custom(
        () => (
          <div
            style={{
              background: "oklch(0.22 0.02 60)",
              border: "1px solid oklch(0.55 0.18 60)",
              color: "oklch(0.92 0.08 60)",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              minWidth: "280px",
              maxWidth: "380px",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>
              🔥 {streak.currentStreak}-day streak!
            </div>
            <div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
              {milestone}
            </div>
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(tweetText)
                  .then(() => {
                    toast.success("Tweet copied to clipboard!", {
                      duration: 2500,
                    });
                  })
                  .catch(() => {
                    toast.error("Couldn't copy — try manually", {
                      duration: 2500,
                    });
                  });
              }}
              style={{
                alignSelf: "flex-start",
                marginTop: "0.25rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "0.5rem",
                background: "oklch(0.55 0.18 60)",
                color: "oklch(0.1 0.01 60)",
                fontSize: "0.7rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              📤 Share
            </button>
          </div>
        ),
        { duration: 8000 }
      );
      localStorage.setItem("streak_milestone_day", today);
      setLastMilestoneDay(today);
    }
  }, [streak.currentStreak, today, lastMilestoneDay, setLastMilestoneDay]);

  // Check if a plan was already generated today
  const hasTodayPlan = (() => {
    try {
      const history = JSON.parse(
        localStorage.getItem("study_plan_history_v1") ?? "[]"
      ) as Array<{ date: string }>;
      return history.length > 0 && history[history.length - 1].date === today;
    } catch {
      return false;
    }
  })();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearTodayPlan = () => {
    try {
      const history = JSON.parse(
        localStorage.getItem("study_plan_history_v1") ?? "[]"
      ) as Array<{ date: string }>;
      const filtered = history.filter(h => h.date !== today);
      localStorage.setItem("study_plan_history_v1", JSON.stringify(filtered));
      // Force page re-render by dispatching a storage event
      window.dispatchEvent(new Event("storage"));
      scrollTo("study-session-planner");
    } catch {
      scrollTo("study-session-planner");
    }
  };

  const lastActiveFormatted = streak.lastVisit
    ? new Date(streak.lastVisit + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-background/90 backdrop-blur-sm border-b border-border flex items-center gap-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:block">
        Quick Actions
      </span>
      <div className="flex gap-2 flex-1 flex-wrap">
        <button
          onClick={() => scrollTo("study-session-planner")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
        >
          <Brain size={12} />
          {hasTodayPlan ? "Resume Today's Plan" : "Plan Today's Session"}
          <kbd className="ml-1 px-1 py-0.5 rounded text-[9px] font-mono bg-emerald-900/40 text-emerald-400 border border-emerald-700/40">
            ⌥1
          </kbd>
        </button>
        {hasTodayPlan && (
          <button
            onClick={clearTodayPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
            title="Clear today's plan and generate a new one"
          >
            New Plan
          </button>
        )}
        <button
          onClick={() => scrollTo("full-mock-day")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all"
        >
          <Trophy size={12} />
          Start Full Mock Day
        </button>
        <DailyDrillButton />
      </div>
      {streak.currentStreak > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-400 whitespace-nowrap ml-auto cursor-default select-none">
              🔥 {streak.currentStreak} day
              {streak.currentStreak !== 1 ? "s" : ""}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs space-y-1">
            <div className="font-semibold">Daily Prep Streak</div>
            <div>
              Current: {streak.currentStreak} day
              {streak.currentStreak !== 1 ? "s" : ""}
            </div>
            <div>
              Best: {streak.longestStreak} day
              {streak.longestStreak !== 1 ? "s" : ""}
            </div>
            {lastActiveFormatted && (
              <div className="text-muted-foreground">
                Last active: {lastActiveFormatted}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      )}
      <button
        onClick={() =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "?", bubbles: true })
          )
        }
        title="Keyboard shortcuts (?)"
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0"
      >
        <HelpCircle size={13} />
      </button>
    </div>
  );
}
import { SevenDaySprintPlan } from "@/components/SevenDaySprintPlan";
import { ProgressAnalyticsDashboard } from "@/components/ProgressAnalyticsDashboard";
import { ScoreSyncBanner } from "@/components/ScoreSyncBanner";
import { FeatureHeatmapRow } from "@/components/FeatureHeatmapRow";

export default function OverviewTab() {
  const [interviewDate] = useInterviewDate();
  const daysLeft = interviewDate ? getDaysUntil(interviewDate) : null;
  return (
    <div className="space-y-6">
      {/* ═══ HIGH IMPACT FEATURES — TOP OF PAGE ═══════════════════════════════ */}
      <FeatureHeatmapRow
        featureKeys={[
          "interview_readiness_report",
          "seven_day_sprint_plan",
          "progress_analytics",
        ]}
      />
      <InterviewReadinessReport />
      <div id="seven-day-sprint">
        <SevenDaySprintPlan />
      </div>
      <div id="progress-analytics">
        <ProgressAnalyticsDashboard />
      </div>
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <ScoreSyncBanner />
      <QuickActionsRow />
      <OnboardingChecklist />
      {daysLeft !== null && <UrgencyModeBanner daysLeft={daysLeft} />}
      <div id="study-session-planner">
        <StudySessionPlanner />
      </div>
      <div id="full-mock-day">
        <FullMockDaySimulator />
      </div>
      <LevelCards />
      <ReadinessDashboard />
      <HeatmapCalendar />
      <WeakPatternHeatmap />
      <WeakSpotStudyPlan />
      <DailyStudyChecklist />
      <InterviewCountdown />
      <PrepTimeline />
      <StarStoryBank />
      <InterviewDayChecklist />
      <DayOfModePanel />
      <LastMileCheatSheet />
      <ConfidenceCalibrationQuiz />
      <ResourcesSection />
      <ReadinessGoalSetter />
      <CTCIDivergenceReport />
      <MostHintedBadge />
      <WeeklyDigest />
      <SharePrepState />
      <div className="flex justify-start">
        <ProgressExport />
      </div>
      {/* InterviewReadinessReport moved to top */}
      <DisclaimerStatusBadge />
    </div>
  );
}
