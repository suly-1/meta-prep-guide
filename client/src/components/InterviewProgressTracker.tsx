/**
 * InterviewProgressTracker — performance over time with trend charts.
 *
 * Data sources (in priority order):
 *  1. Server snapshots via trpc.progress.list (logged-in users)
 *  2. Local readiness trend from useReadinessTrend()
 *  3. Computed from current pattern/behavioral ratings
 *
 * Charts:
 *  - Line chart: Coding %, Behavioral %, Overall % over time
 *  - Bar chart: Mock sessions per week
 *  - Stat cards: Current streak, patterns mastered, sessions done, best score
 */
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Target,
  Zap,
  Award,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  usePatternRatings,
  useBehavioralRatings,
  useMockHistory,
  useStreak,
  useReadinessTrend,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────
function computeCodingPct(ratings: Record<string, number>): number {
  if (!PATTERNS.length) return 0;
  const total = PATTERNS.reduce((s, p) => s + (ratings[p.id] ?? 0), 0);
  return Math.round((total / (PATTERNS.length * 5)) * 100);
}

function computeBehavioralPct(ratings: Record<string, number>): number {
  if (!BEHAVIORAL_QUESTIONS.length) return 0;
  const total = BEHAVIORAL_QUESTIONS.reduce(
    (s, q) => s + (ratings[q.id] ?? 0),
    0
  );
  return Math.round((total / (BEHAVIORAL_QUESTIONS.length * 5)) * 100);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${color}`}
      >
        <Icon size={12} />
        {label}
      </div>
      <div
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function InterviewProgressTracker() {
  const { isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [mockHistory] = useMockHistory();
  const streak = useStreak();
  const [readinessTrend] = useReadinessTrend();

  // Server snapshots (only for logged-in users)
  const { data: serverSnapshots } = trpc.progress.list.useQuery(
    { days: 60 },
    { enabled: isAuthenticated, staleTime: 60_000 }
  );

  const saveSnapshot = trpc.progress.save.useMutation({
    onSuccess: () => {
      toast.success("Progress snapshot saved to server");
    },
    onError: () => toast.error("Could not save snapshot"),
  });

  // Current computed values
  const codingPct = useMemo(
    () => computeCodingPct(patternRatings),
    [patternRatings]
  );
  const behavioralPct = useMemo(
    () => computeBehavioralPct(bqRatings),
    [bqRatings]
  );
  const overallPct = Math.round(
    codingPct * 0.45 +
      behavioralPct * 0.35 +
      Math.min(mockHistory.length * 10, 20)
  );
  const patternsMastered = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) >= 4
  ).length;

  // Build chart data: prefer server snapshots, fall back to local readiness trend
  const trendData = useMemo(() => {
    if (serverSnapshots && serverSnapshots.length > 0) {
      return [...serverSnapshots]
        .reverse()
        .slice(-30)
        .map(s => ({
          date: formatDate(s.snapshotDate),
          coding: s.codingPct,
          behavioral: s.behavioralPct,
          overall: s.overallPct,
          streak: s.streakDays,
        }));
    }
    // Fall back to local readiness trend
    if (readinessTrend && readinessTrend.length > 0) {
      return readinessTrend
        .slice(-30)
        .map((s: { date: string; pct: number }) => ({
          date: formatDate(s.date),
          coding: s.pct,
          behavioral: s.pct,
          overall: s.pct,
          streak: streak.currentStreak,
        }));
    }
    // Minimal single-point from current state
    return [
      {
        date: formatDate(new Date().toISOString().slice(0, 10)),
        coding: codingPct,
        behavioral: behavioralPct,
        overall: overallPct,
        streak: streak.currentStreak,
      },
    ];
  }, [
    serverSnapshots,
    readinessTrend,
    codingPct,
    behavioralPct,
    overallPct,
    streak.currentStreak,
  ]);

  // Mock sessions per week (last 8 weeks)
  const weeklyMocks = useMemo(() => {
    const weeks: Record<string, number> = {};
    mockHistory.forEach((s: { date: string }) => {
      const d = new Date(s.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] ?? 0) + 1;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([date, count]) => ({ week: formatDate(date), sessions: count }));
  }, [mockHistory]);

  // Radar data for category coverage
  const radarData = [
    { subject: "Coding", value: codingPct, fullMark: 100 },
    { subject: "Behavioral", value: behavioralPct, fullMark: 100 },
    {
      subject: "Mocks",
      value: Math.min(mockHistory.length * 10, 100),
      fullMark: 100,
    },
    {
      subject: "Streak",
      value: Math.min(streak.currentStreak * 5, 100),
      fullMark: 100,
    },
    {
      subject: "Mastery",
      value: Math.round((patternsMastered / PATTERNS.length) * 100),
      fullMark: 100,
    },
  ];

  const handleSaveSnapshot = async () => {
    if (!isAuthenticated) {
      toast.info("Sign in to save progress snapshots to the server");
      return;
    }
    setIsSaving(true);
    try {
      await saveSnapshot.mutateAsync({
        codingPct,
        behavioralPct,
        overallPct,
        streakDays: streak.currentStreak,
        mockSessionCount: mockHistory.length,
        patternsMastered,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-blue-400" />
          <span className="text-sm font-semibold text-foreground">
            Interview Progress Tracker
          </span>
          <span className="text-xs text-muted-foreground">
            — performance over time
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => {
              e.stopPropagation();
              handleSaveSnapshot();
            }}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 text-xs text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
          >
            <Save size={11} />
            {isSaving ? "Saving…" : "Save Snapshot"}
          </button>
          {expanded ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={Zap}
              label="Current Streak"
              value={`${streak.currentStreak}d`}
              sub={`Best: ${streak.longestStreak}d`}
              color="text-amber-400"
            />
            <StatCard
              icon={Target}
              label="Patterns Mastered"
              value={patternsMastered}
              sub={`of ${PATTERNS.length} total`}
              color="text-blue-400"
            />
            <StatCard
              icon={Calendar}
              label="Mock Sessions"
              value={mockHistory.length}
              sub="total completed"
              color="text-emerald-400"
            />
            <StatCard
              icon={Award}
              label="Overall Readiness"
              value={`${overallPct}%`}
              sub={
                overallPct >= 70
                  ? "On track"
                  : overallPct >= 40
                    ? "Progressing"
                    : "Keep going"
              }
              color={
                overallPct >= 70
                  ? "text-emerald-400"
                  : overallPct >= 40
                    ? "text-blue-400"
                    : "text-amber-400"
              }
            />
          </div>

          {/* Readiness trend line chart */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">
              Readiness Trend
            </div>
            {trendData.length < 2 ? (
              <div className="rounded-lg border border-border bg-secondary/20 p-4 text-center text-xs text-muted-foreground">
                Rate more patterns and behavioral questions to build your trend
                chart.
                {isAuthenticated && (
                  <span className="block mt-1 text-blue-400">
                    Click "Save Snapshot" above to record today's progress to
                    the server.
                  </span>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={trendData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(value: number) => [`${value}%`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line
                    type="monotone"
                    dataKey="coding"
                    name="Coding"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="behavioral"
                    name="Behavioral"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="overall"
                    name="Overall"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeDasharray="4 2"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Two-column: bar chart + radar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mock sessions per week */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                Mock Sessions / Week
              </div>
              {weeklyMocks.length === 0 ? (
                <div className="rounded-lg border border-border bg-secondary/20 p-4 text-center text-xs text-muted-foreground">
                  Complete mock sessions to see your weekly practice cadence.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={weeklyMocks}
                    margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="week"
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <Bar
                      dataKey="sessions"
                      name="Sessions"
                      fill="#3b82f6"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Radar: category coverage */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                Coverage Radar
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <RadarChart
                  data={radarData}
                  margin={{ top: 4, right: 16, bottom: 4, left: 16 }}
                >
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <Radar
                    name="You"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(value: number) => [`${value}%`]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insight bullets */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-1.5">
            <div className="text-xs font-semibold text-blue-400">Insights</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {codingPct < 60 && (
                <li>
                  • Coding readiness is at {codingPct}% — focus on your{" "}
                  <span className="text-amber-400 font-medium">
                    weakest 3 patterns
                  </span>{" "}
                  first.
                </li>
              )}
              {behavioralPct < 60 && (
                <li>
                  • Behavioral readiness is at {behavioralPct}% — write STAR
                  stories for{" "}
                  <span className="text-amber-400 font-medium">
                    Conflict & Influence
                  </span>{" "}
                  questions.
                </li>
              )}
              {mockHistory.length < 3 && (
                <li>
                  • You've done {mockHistory.length} mock session
                  {mockHistory.length !== 1 ? "s" : ""} — aim for at least{" "}
                  <span className="text-blue-400 font-medium">
                    5 full mocks
                  </span>{" "}
                  before your interview.
                </li>
              )}
              {streak.currentStreak >= 7 && (
                <li>
                  • 🔥 {streak.currentStreak}-day streak — excellent
                  consistency. Keep it going.
                </li>
              )}
              {patternsMastered >= 10 && (
                <li>
                  • ✅ {patternsMastered} patterns mastered — strong coding
                  foundation.
                </li>
              )}
              {codingPct >= 70 && behavioralPct >= 70 && (
                <li>
                  • Both coding and behavioral are above 70% — shift focus to{" "}
                  <span className="text-emerald-400 font-medium">
                    system design depth
                  </span>
                  .
                </li>
              )}
              {codingPct >= 60 &&
                behavioralPct >= 60 &&
                mockHistory.length >= 3 && (
                  <li>
                    • You're on track for a strong interview performance.
                    Consider scheduling a mock with a peer.
                  </li>
                )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
