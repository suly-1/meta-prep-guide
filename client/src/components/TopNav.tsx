// Design: Bold Engineering Dashboard — dark charcoal, Space Grotesk, blue accent
import { Sun, Moon, BookOpen, CalendarClock } from "lucide-react";
import { useStreak, useInterviewDate, useSpacedRepetition, useBehavioralRatings } from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Countdown pill ─────────────────────────────────────────────────────────
function CountdownPill({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const [interviewDate] = useInterviewDate();

  if (!interviewDate) return null;

  const days = getDaysUntil(interviewDate);

  const color =
    days < 0
      ? "text-muted-foreground border-border bg-secondary"
      : days <= 7
      ? "text-red-400 border-red-500/30 bg-red-500/10"
      : days <= 14
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";

  const label =
    days < 0
      ? "Interview passed"
      : days === 0
      ? "Interview today!"
      : days === 1
      ? "1 day left"
      : `${days} days left`;

  return (
    <button
      onClick={() => onTabChange("overview")}
      title="Go to Interview Day Checklist"
      className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all hover:opacity-80 ${color}`}
    >
      <CalendarClock size={11} />
      {label}
    </button>
  );
}

// ── SR due-count badge ─────────────────────────────────────────────────────
function useSRDueCounts() {
  const [srDue] = useSpacedRepetition();
  const [bqRatings] = useBehavioralRatings();
  const today = new Date().toISOString().split("T")[0];

  // Coding patterns due
  const codingDue = PATTERNS.filter(p => srDue[p.id] && srDue[p.id] <= today).length;

  // Behavioral questions: treat any rated question whose last rating date (stored as srDue key)
  // is past due as "due". We reuse the same srDue store keyed by question id.
  const behavioralDue = BEHAVIORAL_QUESTIONS.filter(q => srDue[q.id] && srDue[q.id] <= today).length;

  return { codingDue, behavioralDue };
}

export default function TopNav({ activeTab, onTabChange, darkMode, onToggleDark }: TopNavProps) {
  const streak = useStreak();
  const { codingDue, behavioralDue } = useSRDueCounts();

  const TABS = [
    { id: "overview",   label: "Overview",      due: 0 },
    { id: "coding",     label: "Coding",        due: codingDue },
    { id: "behavioral", label: "Behavioral",    due: behavioralDue },
    { id: "design",     label: "System Design", due: 0 },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Meta Prep
            </span>
            <span className="badge badge-blue hidden sm:inline-flex">IC6/IC7</span>
          </div>

          {/* Tabs — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {tab.label}
                {tab.due > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center leading-none">
                    {tab.due}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right: countdown + streak + dark toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Interview day countdown */}
            <CountdownPill onTabChange={onTabChange} />

            {/* Streak */}
            <div
              className={`streak-badge text-sm ${streak.currentStreak === 0 ? "broken" : ""}`}
              title={`Longest streak: ${streak.longestStreak} days`}
            >
              <span>{streak.currentStreak > 0 ? "🔥" : "💤"}</span>
              <span>{streak.currentStreak}d</span>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {tab.label}
              {tab.due > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center leading-none">
                  {tab.due}
                </span>
              )}
            </button>
          ))}
          {/* Mobile countdown */}
          <CountdownPill onTabChange={onTabChange} />
        </div>
      </div>
    </header>
  );
}
