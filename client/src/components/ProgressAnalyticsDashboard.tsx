/**
 * Progress & Performance Analytics Dashboard
 * Visualizes persistent scores from DB + localStorage.
 * Shows: pattern mastery heatmap, BQ readiness radar, score trends,
 * and anonymized aggregate stats ("You vs. all candidates").
 */
import { useState, useMemo } from "react";
import {
  BarChart2,
  TrendingUp,
  Users,
  Code2,
  Brain,
  Layers,
  Star,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  usePatternRatings,
  useBehavioralRatings,
  useStarNotes,
  useMockHistory,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";

// ── Mini bar ──────────────────────────────────────────────────────────────

function MiniBar({
  value,
  max = 5,
  color = "bg-blue-500",
  showLabel = true,
}: {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] text-muted-foreground w-6 text-right">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ── Score card ─────────────────────────────────────────────────────────────

function ScoreCard({
  label,
  value,
  max = 100,
  icon,
  color,
  subtitle,
  vsAvg,
}: {
  label: string;
  value: number;
  max?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  vsAvg?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const diff = vsAvg !== undefined ? value - vsAvg : null;

  return (
    <div className="p-3 rounded-xl bg-secondary/30 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className={`${color} shrink-0`}>{icon}</div>
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-end gap-1 mb-1.5">
        <span
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {Math.round(value)}
        </span>
        <span className="text-xs text-muted-foreground mb-1">/{max}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct >= 80
              ? "bg-emerald-500"
              : pct >= 60
                ? "bg-blue-500"
                : pct >= 40
                  ? "bg-amber-500"
                  : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      )}
      {diff !== null && (
        <p
          className={`text-[10px] font-semibold mt-0.5 ${diff >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {diff >= 0 ? "+" : ""}
          {diff.toFixed(1)} vs avg
        </p>
      )}
    </div>
  );
}

// ── Pattern grid ───────────────────────────────────────────────────────────

function PatternMasteryGrid({
  ratings,
  avgRatings,
}: {
  ratings: Record<string, number>;
  avgRatings: Record<string, number>;
}) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...PATTERNS].sort(
    (a, b) => (ratings[a.id] ?? 0) - (ratings[b.id] ?? 0)
  );
  const displayed = showAll ? sorted : sorted.slice(0, 8);

  const ratingColor = (r: number) => {
    if (r >= 4) return "text-emerald-400";
    if (r >= 3) return "text-blue-400";
    if (r >= 2) return "text-amber-400";
    if (r >= 1) return "text-red-400";
    return "text-muted-foreground/40";
  };

  const ratingBg = (r: number) => {
    if (r >= 4) return "bg-emerald-500";
    if (r >= 3) return "bg-blue-500";
    if (r >= 2) return "bg-amber-500";
    if (r >= 1) return "bg-red-500";
    return "bg-secondary";
  };

  return (
    <div>
      <div className="space-y-1.5">
        {displayed.map(p => {
          const myRating = ratings[p.id] ?? 0;
          const avgRating = avgRatings[p.id] ?? 0;
          return (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-36 truncate shrink-0">
                {p.name}
              </span>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${ratingBg(myRating)} rounded-full transition-all duration-500`}
                    style={{ width: `${(myRating / 5) * 100}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold w-4 ${ratingColor(myRating)}`}
                >
                  {myRating || "—"}
                </span>
              </div>
              {avgRating > 0 && (
                <div className="flex items-center gap-1 w-20">
                  <div className="flex-1 h-1 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500/40 rounded-full"
                      style={{ width: `${(avgRating / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground/50 w-4">
                    {avgRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {PATTERNS.length > 8 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp size={11} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={11} /> Show all {PATTERNS.length} patterns
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ProgressAnalyticsDashboard() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [starNotes] = useStarNotes();
  const [mockHistory] = useMockHistory();

  // Fetch aggregate stats from DB
  const { data: aggStats } = trpc.userScores.getAggregateStats.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );

  // Compute my scores
  const myPatternAvg = useMemo(() => {
    const rated = PATTERNS.filter(p => (patternRatings[p.id] ?? 0) > 0);
    if (rated.length === 0) return 0;
    return (
      rated.reduce((s, p) => s + (patternRatings[p.id] ?? 0), 0) / rated.length
    );
  }, [patternRatings]);

  const myBQAvg = useMemo(() => {
    const rated = BEHAVIORAL_QUESTIONS.filter(q => (bqRatings[q.id] ?? 0) > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((s, q) => s + (bqRatings[q.id] ?? 0), 0) / rated.length;
  }, [bqRatings]);

  const patternsMastered = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) >= 4
  ).length;
  const patternsWeak = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) > 0 && (patternRatings[p.id] ?? 0) <= 2
  ).length;
  const storiesWritten = Object.values(starNotes).filter(
    n => n && n.trim().length > 20
  ).length;
  const mocksDone = Array.isArray(mockHistory) ? mockHistory.length : 0;

  // Compute overall readiness score (0–100)
  const overallScore = useMemo(() => {
    const patternScore = (myPatternAvg / 5) * 40; // 40% weight
    const bqScore = (myBQAvg / 5) * 30; // 30% weight
    const storyScore = Math.min(1, storiesWritten / 8) * 20; // 20% weight
    const mockScore = Math.min(1, mocksDone / 5) * 10; // 10% weight
    return Math.round(patternScore + bqScore + storyScore + mockScore);
  }, [myPatternAvg, myBQAvg, storiesWritten, mocksDone]);

  // Avg aggregate scores
  const aggPatternAvg = useMemo(() => {
    if (!aggStats?.patternAvgRatings) return 0;
    const vals = Object.values(aggStats.patternAvgRatings);
    if (vals.length === 0) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }, [aggStats]);

  const aggBQAvg = useMemo(() => {
    if (!aggStats?.bqAvgRatings) return 0;
    const vals = Object.values(aggStats.bqAvgRatings);
    if (vals.length === 0) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }, [aggStats]);

  const totalUsers = aggStats?.totalUsers ?? 0;

  return (
    <div className="prep-card p-5" id="progress-analytics">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
          <BarChart2 size={16} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              className="text-base font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Progress & Performance Analytics
            </h2>
            {totalUsers > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <Users size={9} /> {totalUsers.toLocaleString()} candidates
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your scores vs. anonymized aggregate data from all candidates using
            this guide.
          </p>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <ScoreCard
          label="Overall Readiness"
          value={overallScore}
          max={100}
          icon={<Award size={14} />}
          color="text-amber-400"
          subtitle="Coding 40% · BQ 30% · Stories 20% · Mocks 10%"
        />
        <ScoreCard
          label="Pattern Mastery"
          value={myPatternAvg * 20}
          max={100}
          icon={<Code2 size={14} />}
          color="text-blue-400"
          subtitle={`${patternsMastered} mastered · ${patternsWeak} weak`}
          vsAvg={aggPatternAvg > 0 ? aggPatternAvg * 20 : undefined}
        />
        <ScoreCard
          label="Behavioral Readiness"
          value={myBQAvg * 20}
          max={100}
          icon={<Brain size={14} />}
          color="text-purple-400"
          subtitle={`${storiesWritten} STAR stories written`}
          vsAvg={aggBQAvg > 0 ? aggBQAvg * 20 : undefined}
        />
        <ScoreCard
          label="Mock Sessions"
          value={Math.min(100, mocksDone * 20)}
          max={100}
          icon={<Layers size={14} />}
          color="text-emerald-400"
          subtitle={`${mocksDone} sessions completed`}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pattern mastery */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={13} className="text-blue-400" />
            <span className="text-xs font-bold text-foreground">
              Pattern Mastery
            </span>
            {totalUsers > 1 && (
              <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                <Info size={9} /> Thin bar = avg
              </span>
            )}
          </div>
          <PatternMasteryGrid
            ratings={patternRatings}
            avgRatings={aggStats?.patternAvgRatings ?? {}}
          />
        </div>

        {/* BQ + stories + insights */}
        <div className="space-y-4">
          {/* BQ breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={13} className="text-purple-400" />
              <span className="text-xs font-bold text-foreground">
                Behavioral Readiness
              </span>
            </div>
            <div className="space-y-1.5">
              {BEHAVIORAL_QUESTIONS.slice(0, 8).map(q => {
                const r = bqRatings[q.id] ?? 0;
                return (
                  <div key={q.id} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-36 truncate shrink-0">
                      {q.q?.slice(0, 30) ?? q.id}…
                    </span>
                    <MiniBar
                      value={r}
                      color={
                        r >= 4
                          ? "bg-emerald-500"
                          : r >= 3
                            ? "bg-blue-500"
                            : r >= 2
                              ? "bg-amber-500"
                              : r >= 1
                                ? "bg-red-500"
                                : "bg-secondary"
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insights */}
          <div className="p-3 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={12} className="text-emerald-400" />
              <span className="text-xs font-bold text-foreground">
                Key Insights
              </span>
            </div>
            <ul className="space-y-1.5">
              {patternsMastered >= 10 && (
                <li className="text-[11px] text-emerald-400 flex items-start gap-1.5">
                  <Star size={10} className="shrink-0 mt-0.5" />
                  {patternsMastered} patterns mastered — strong coding
                  foundation
                </li>
              )}
              {patternsWeak > 3 && (
                <li className="text-[11px] text-amber-400 flex items-start gap-1.5">
                  <span className="shrink-0">⚠</span>
                  {patternsWeak} weak patterns — use the sprint plan to address
                  these first
                </li>
              )}
              {storiesWritten < 4 && (
                <li className="text-[11px] text-red-400 flex items-start gap-1.5">
                  <span className="shrink-0">!</span>
                  Only {storiesWritten} STAR stories — aim for 6–8 before your
                  interview
                </li>
              )}
              {storiesWritten >= 6 && (
                <li className="text-[11px] text-emerald-400 flex items-start gap-1.5">
                  <Star size={10} className="shrink-0 mt-0.5" />
                  {storiesWritten} STAR stories — solid behavioral coverage
                </li>
              )}
              {mocksDone === 0 && (
                <li className="text-[11px] text-amber-400 flex items-start gap-1.5">
                  <span className="shrink-0">⚠</span>
                  No mock sessions yet — schedule one this week
                </li>
              )}
              {mocksDone >= 3 && (
                <li className="text-[11px] text-emerald-400 flex items-start gap-1.5">
                  <Star size={10} className="shrink-0 mt-0.5" />
                  {mocksDone} mock sessions — great practice cadence
                </li>
              )}
              {overallScore >= 70 && (
                <li className="text-[11px] text-blue-400 flex items-start gap-1.5">
                  <TrendingUp size={10} className="shrink-0 mt-0.5" />
                  Overall readiness {overallScore}% — you're in strong shape
                </li>
              )}
              {overallScore < 40 && (
                <li className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <span className="shrink-0">→</span>
                  Start by rating all patterns and writing 3 STAR stories to
                  unlock your baseline
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
