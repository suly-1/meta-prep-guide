// Design: Bold Engineering Dashboard — large stat numbers, fire streak, progress bar
import {
  useStreak,
  usePatternRatings,
  useBehavioralRatings,
  useMockHistory,
  useInterviewDate,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";
import {
  Flame,
  Target,
  Brain,
  Calendar,
  TrendingUp,
  Award,
} from "lucide-react";
import Leaderboard from "@/components/Leaderboard";
import CrossDeviceSync from "@/components/CrossDeviceSync";
import ShareMessageButton from "@/components/ShareMessageButton";

// ── Achievement Badges ─────────────────────────────────────────────────────
const BADGE_DEFS = [
  {
    id: "first_blood",
    emoji: "🩸",
    label: "First Blood",
    desc: "Master your first pattern",
    check: (p: number, _m: number, _s: number) => p >= 1,
  },
  {
    id: "on_fire",
    emoji: "🔥",
    label: "On Fire",
    desc: "7-day study streak",
    check: (_p: number, _m: number, s: number) => s >= 7,
  },
  {
    id: "half_way",
    emoji: "⚡",
    label: "Half-Way There",
    desc: "Master 7 of 14 patterns",
    check: (p: number, _m: number, _s: number) => p >= 7,
  },
  {
    id: "mock_veteran",
    emoji: "🎯",
    label: "Mock Veteran",
    desc: "Complete 5 mock sessions",
    check: (_p: number, m: number, _s: number) => m >= 5,
  },
  {
    id: "ic7_ready",
    emoji: "⭐",
    label: "L7 Ready",
    desc: "Master all 14 patterns",
    check: (p: number, _m: number, _s: number) => p >= PATTERNS.length,
  },
] as const;

function AchievementBadges({
  masteredPatterns,
  mockSessions,
  streak,
}: {
  masteredPatterns: number;
  mockSessions: number;
  streak: number;
}) {
  const earned = BADGE_DEFS.filter(b =>
    b.check(masteredPatterns, mockSessions, streak)
  );
  const locked = BADGE_DEFS.filter(
    b => !b.check(masteredPatterns, mockSessions, streak)
  );
  return (
    <div className="prep-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Award size={14} className="text-amber-400" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Achievement Badges
        </span>
        <span className="badge badge-amber ml-auto">
          {earned.length}/{BADGE_DEFS.length} earned
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {BADGE_DEFS.map(b => {
          const isEarned = b.check(masteredPatterns, mockSessions, streak);
          return (
            <div
              key={b.id}
              title={b.desc}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                isEarned
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                  : "bg-secondary border-border text-muted-foreground opacity-40 grayscale"
              }`}
            >
              <span>{b.emoji}</span>
              <span>{b.label}</span>
            </div>
          );
        })}
      </div>
      {locked.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Next:{" "}
          <span className="text-foreground font-medium">
            {locked[0].emoji} {locked[0].label}
          </span>{" "}
          — {locked[0].desc}
        </div>
      )}
    </div>
  );
}

interface HeroSectionProps {
  onTabChange: (tab: string) => void;
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function HeroSection({ onTabChange }: HeroSectionProps) {
  const streak = useStreak();
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [mockHistory] = useMockHistory();
  const [interviewDate] = useInterviewDate();

  const masteredPatterns = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) >= 4
  ).length;
  const readyStories = BEHAVIORAL_QUESTIONS.filter(
    q => (bqRatings[q.id] ?? 0) >= 4
  ).length;
  const avgMock = mockHistory.length
    ? (
        mockHistory.reduce((s, m) => s + m.avgScore, 0) / mockHistory.length
      ).toFixed(1)
    : "—";

  const overallPct = Math.round(
    ((masteredPatterns / PATTERNS.length) * 0.6 +
      (readyStories / BEHAVIORAL_QUESTIONS.length) * 0.4) *
      100
  );

  const daysLeft = interviewDate ? getDaysUntil(interviewDate) : null;

  return (
    <div className="border-b border-border bg-gradient-to-b from-secondary/30 to-background py-8 mb-6">
      <div className="container">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1
              className="text-2xl font-bold text-foreground mb-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Engineering Interview Prep
            </h1>
            <p className="text-sm text-muted-foreground">
              L4 (SWE) · L5 (Senior) · L6 (Staff) · L7 (Senior Staff) — Coding ·
              System Design · Behavioral · Independent Community Resource
            </p>
          </div>
          {/* Streak hero badge */}
          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
              streak.currentStreak > 0
                ? "bg-orange-500/10 border-orange-500/30"
                : "bg-secondary border-border"
            }`}
          >
            <Flame
              size={24}
              className={
                streak.currentStreak > 0
                  ? "text-orange-400"
                  : "text-muted-foreground"
              }
            />
            <div>
              <div
                className="text-2xl font-extrabold leading-none"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color:
                    streak.currentStreak > 0
                      ? "oklch(0.85 0.15 45)"
                      : undefined,
                }}
              >
                {streak.currentStreak}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {streak.currentStreak === 1 ? "day streak" : "day streak"}
                {streak.longestStreak > 0 && ` · best ${streak.longestStreak}`}
              </div>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Overall Readiness
            </span>
            <span
              className="text-sm font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {overallPct}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Weighted: 60% coding patterns + 40% behavioral stories
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Patterns mastered */}
          <button
            onClick={() => onTabChange("coding")}
            className="prep-card p-4 text-left hover:border-blue-500/40 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-blue-400" />
              <span className="text-xs text-muted-foreground font-medium">
                Patterns
              </span>
            </div>
            <div className="stat-num text-2xl text-foreground group-hover:text-blue-400 transition-colors">
              {masteredPatterns}
              <span className="text-sm font-normal text-muted-foreground">
                /{PATTERNS.length}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              mastered (★4–5)
            </div>
          </button>

          {/* Stories ready */}
          <button
            onClick={() => onTabChange("behavioral")}
            className="prep-card p-4 text-left hover:border-purple-500/40 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} className="text-purple-400" />
              <span className="text-xs text-muted-foreground font-medium">
                STAR Stories
              </span>
            </div>
            <div className="stat-num text-2xl text-foreground group-hover:text-purple-400 transition-colors">
              {readyStories}
              <span className="text-sm font-normal text-muted-foreground">
                /{BEHAVIORAL_QUESTIONS.length}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ready (★4–5)
            </div>
          </button>

          {/* Mock average */}
          <button
            onClick={() => onTabChange("behavioral")}
            className="prep-card p-4 text-left hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-xs text-muted-foreground font-medium">
                Mock Avg
              </span>
            </div>
            <div className="stat-num text-2xl text-foreground group-hover:text-emerald-400 transition-colors">
              {avgMock}
              {avgMock !== "—" && (
                <span className="text-sm font-normal text-muted-foreground">
                  /5
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {mockHistory.length} session{mockHistory.length !== 1 ? "s" : ""}
            </div>
          </button>

          {/* Interview countdown */}
          <button
            onClick={() => onTabChange("overview")}
            className={`prep-card p-4 text-left transition-all group ${
              daysLeft !== null && daysLeft <= 7
                ? "hover:border-red-500/40"
                : "hover:border-amber-500/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar
                size={14}
                className={
                  daysLeft !== null && daysLeft <= 7
                    ? "text-red-400"
                    : "text-amber-400"
                }
              />
              <span className="text-xs text-muted-foreground font-medium">
                Interview
              </span>
            </div>
            <div
              className={`stat-num text-2xl transition-colors ${
                daysLeft === null
                  ? "text-muted-foreground"
                  : daysLeft <= 7
                    ? "text-red-400"
                    : "text-amber-400"
              }`}
            >
              {daysLeft === null
                ? "—"
                : daysLeft === 0
                  ? "Today!"
                  : `${daysLeft}d`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {daysLeft === null
                ? "set a date"
                : daysLeft === 0
                  ? "Good luck!"
                  : "remaining"}
            </div>
          </button>
        </div>
      </div>
      {/* Share Message Copy Button */}
      <div className="container mt-4">
        <ShareMessageButton />
      </div>
      {/* Achievement Badges */}
      <div className="container mt-4">
        <AchievementBadges
          masteredPatterns={masteredPatterns}
          mockSessions={mockHistory.length}
          streak={streak.currentStreak}
        />
      </div>

      {/* Leaderboard */}
      <div className="mt-4" id="hero-leaderboard">
        <Leaderboard />
      </div>
      {/* Cross-device sync */}
      <div className="mt-3">
        <CrossDeviceSync />
      </div>
    </div>
  );
}
