// Design: Bold Engineering Dashboard — dark charcoal, Space Grotesk, blue accent
import { Sun, Moon, BookOpen, CalendarClock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useStreak, useInterviewDate, useSpacedRepetition, usePatternRatings, useBehavioralRatings, useFlashCardSRDue, useDailyChecklist } from "@/hooks/useLocalStorage";
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

// ── Badge breakdown popover ────────────────────────────────────────────────
interface BadgePopoverProps {
  items: { label: string; reason: string }[];
  onJump: () => void;
  onClose: () => void;
  title: string;
}

function BadgePopover({ items, onJump, onClose, title }: BadgePopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[200] w-64 rounded-xl border border-amber-500/30 bg-background shadow-xl shadow-black/30 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
        <span className="text-xs font-bold text-amber-400">{title}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>
      {/* Item list */}
      <div className="max-h-52 overflow-y-auto divide-y divide-border">
        {items.slice(0, 12).map((item, i) => (
          <button
            key={i}
            onClick={() => { onJump(); onClose(); }}
            className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors group"
          >
            <div className="text-xs font-medium text-foreground group-hover:text-amber-400 transition-colors truncate">{item.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{item.reason}</div>
          </button>
        ))}
        {items.length > 12 && (
          <div className="px-3 py-2 text-[10px] text-muted-foreground">
            +{items.length - 12} more — go to tab to see all
          </div>
        )}
      </div>
      {/* Footer CTA */}
      <div className="px-3 py-2 border-t border-border bg-secondary/30">
        <button
          onClick={() => { onJump(); onClose(); }}
          className="w-full text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors text-center"
        >
          Go to tab to review →
        </button>
      </div>
    </div>
  );
}

// ── Tab badge counters ─────────────────────────────────────────────────────
function useTabBadgeCounts() {
  const [srDue] = useSpacedRepetition();
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [flashCardSRDue] = useFlashCardSRDue();
  const [dailyChecklist] = useDailyChecklist();
  const today = new Date().toISOString().split("T")[0];

  // Coding: SR due patterns + weak patterns (rated 1-2)
  const codingSRDuePatterns = PATTERNS.filter(p => srDue[p.id] && srDue[p.id] <= today);
  const weakPatternsList = PATTERNS.filter(p => (patternRatings[p.id] ?? 0) > 0 && (patternRatings[p.id] ?? 0) <= 2);
  // Deduplicate by id
  const codingItemsMap = new Map<string, { label: string; reason: string }>();
  for (const p of codingSRDuePatterns) {
    codingItemsMap.set(p.id, { label: p.name, reason: "SR review due" });
  }
  for (const p of weakPatternsList) {
    if (!codingItemsMap.has(p.id)) {
      codingItemsMap.set(p.id, { label: p.name, reason: `Rated ${patternRatings[p.id] ?? 0}/5 — needs practice` });
    } else {
      codingItemsMap.set(p.id, { label: p.name, reason: `SR due + rated ${patternRatings[p.id] ?? 0}/5` });
    }
  }
  const codingItems = Array.from(codingItemsMap.values());
  const codingDue = codingItems.length;

  // Behavioral: SR due BQs + weak BQ stories (rated 1-2)
  const behavioralSRDueBQs = BEHAVIORAL_QUESTIONS.filter(q => srDue[q.id] && srDue[q.id] <= today);
  const weakBQsList = BEHAVIORAL_QUESTIONS.filter(q => (bqRatings[q.id] ?? 0) > 0 && (bqRatings[q.id] ?? 0) <= 2);
  const behavioralItemsMap = new Map<string, { label: string; reason: string }>();
  for (const q of behavioralSRDueBQs) {
    behavioralItemsMap.set(q.id, { label: q.q.length > 50 ? q.q.slice(0, 50) + "…" : q.q, reason: "SR review due" });
  }
  for (const q of weakBQsList) {
    if (!behavioralItemsMap.has(q.id)) {
      behavioralItemsMap.set(q.id, { label: q.q.length > 50 ? q.q.slice(0, 50) + "…" : q.q, reason: `Rated ${bqRatings[q.id] ?? 0}/5 — needs practice` });
    } else {
      behavioralItemsMap.set(q.id, { label: q.q.length > 50 ? q.q.slice(0, 50) + "…" : q.q, reason: `SR due + rated ${bqRatings[q.id] ?? 0}/5` });
    }
  }
  const behavioralItems = Array.from(behavioralItemsMap.values());
  const behavioralDue = behavioralItems.length;

  // System Design: flash card SR due count
  const flashCardDue = Object.values(flashCardSRDue).filter(d => d <= today).length;

  // Suppress unused variable warning
  void dailyChecklist;

  return { codingDue, behavioralDue, flashCardDue, codingItems, behavioralItems };
}

export default function TopNav({ activeTab, onTabChange, darkMode, onToggleDark }: TopNavProps) {
  const streak = useStreak();
  const { codingDue, behavioralDue, flashCardDue, codingItems, behavioralItems } = useTabBadgeCounts();
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const TABS = [
    { id: "overview",   label: "Overview",      due: 0,             items: [] as { label: string; reason: string }[] },
    { id: "coding",     label: "Coding",        due: codingDue,     items: codingItems },
    { id: "behavioral", label: "Behavioral",    due: behavioralDue, items: behavioralItems },
    { id: "design",     label: "System Design", due: flashCardDue,  items: [] },
    { id: "collab",     label: "Collab",        due: 0,             items: [] },
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
              <div key={tab.id} className="relative">
                <button
                  onClick={() => {
                    onTabChange(tab.id);
                    setOpenPopover(null);
                  }}
                  className={`relative px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {tab.label}
                  {tab.due > 0 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenPopover(openPopover === tab.id ? null : tab.id);
                      }}
                      title={`${tab.due} item${tab.due !== 1 ? "s" : ""} need attention — click for details`}
                      className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center leading-none cursor-pointer hover:bg-amber-400 transition-colors"
                    >
                      {tab.due}
                    </span>
                  )}
                </button>
                {/* Breakdown popover for Coding and Behavioral */}
                {openPopover === tab.id && tab.items.length > 0 && (
                  <BadgePopover
                    title={`${tab.due} item${tab.due !== 1 ? "s" : ""} need attention`}
                    items={tab.items}
                    onJump={() => onTabChange(tab.id)}
                    onClose={() => setOpenPopover(null)}
                  />
                )}
                {/* Simple tooltip for System Design (no item list) */}
                {openPopover === tab.id && tab.items.length === 0 && tab.due > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[200] px-3 py-2 rounded-lg border border-border bg-background shadow-lg text-xs text-muted-foreground whitespace-nowrap">
                    {tab.due} flash card{tab.due !== 1 ? "s" : ""} due for SR review
                  </div>
                )}
              </div>
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
