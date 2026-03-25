// Design: Bold Engineering Dashboard
// Dark charcoal base, Space Grotesk headings, Inter body
import {
  Sun,
  Moon,
  BookOpen,
  CalendarClock,
  Dices,
  Swords,
  Music,
  AlignJustify,
  Calendar,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { clearAdminToken } from "@/components/AdminPinGate";
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  useStreak,
  useInterviewDate,
  useSpacedRepetition,
  usePatternRatings,
  useBehavioralRatings,
  useFlashCardSRDue,
  useDailyChecklist,
  useDensity,
  useGauntletState,
  useSoundtrack,
  type Density,
  type SoundtrackTrack,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

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
function CountdownPill({
  onTabChange,
}: {
  onTabChange: (tab: string) => void;
}) {
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

// ── Prominent countdown bar (exported, rendered below the header) ─────────────────
export function CountdownBar({
  onTabChange,
}: {
  onTabChange: (tab: string) => void;
}) {
  const [interviewDate, setInterviewDate] = useInterviewDate();
  const [showInput, setShowInput] = useState(false);
  const days = interviewDate ? getDaysUntil(interviewDate) : null;

  const urgency =
    days === null
      ? {
          bar: "bg-blue-500/5 border-blue-500/20",
          num: "text-blue-400",
          badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        }
      : days < 0
        ? {
            bar: "bg-secondary border-border",
            num: "text-muted-foreground",
            badge: "bg-secondary text-muted-foreground border-border",
          }
        : days <= 7
          ? {
              bar: "bg-red-500/8 border-red-500/20",
              num: "text-red-400",
              badge: "bg-red-500/15 text-red-300 border-red-500/30",
            }
          : days <= 14
            ? {
                bar: "bg-amber-500/8 border-amber-500/20",
                num: "text-amber-400",
                badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
              }
            : {
                bar: "bg-emerald-500/5 border-emerald-500/20",
                num: "text-emerald-400",
                badge:
                  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
              };

  const message =
    days === null
      ? "Set your interview date to start the countdown"
      : days < 0
        ? "Interview date has passed"
        : days === 0
          ? "Today is the day — you've got this!"
          : days === 1
            ? "1 day left — final review mode!"
            : days <= 7
              ? `${days} days left — final sprint mode!`
              : days <= 14
                ? `${days} days remaining — stay focused!`
                : `${days} days remaining — stay consistent!`;

  return (
    <div className={`border-b ${urgency.bar} px-4 py-2`}>
      <div className="container flex items-center gap-3 flex-wrap">
        <Calendar size={13} className={urgency.num} />
        {days !== null && (
          <span
            className={`text-2xl font-extrabold tabular-nums leading-none ${urgency.num}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {days < 0 ? "—" : days === 0 ? "🎯" : `${days}d`}
          </span>
        )}
        <span className="text-xs text-muted-foreground flex-1 min-w-0">
          {message}
        </span>
        {showInput ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={interviewDate ?? ""}
              onChange={e => {
                setInterviewDate(e.target.value || null);
                setShowInput(false);
              }}
              autoFocus
              className="px-2.5 py-1 rounded-md bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={() => setShowInput(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-all hover:opacity-80 ${urgency.badge}`}
          >
            {interviewDate ? "Change date" : "Set date"}
          </button>
        )}
        {interviewDate && (
          <button
            onClick={() => onTabChange("overview")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View checklist →
          </button>
        )}
      </div>
    </div>
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
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[200] w-64 rounded-xl border border-amber-500/30 bg-background shadow-xl shadow-black/30 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
        <span className="text-xs font-bold text-amber-400">{title}</span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          ✕
        </button>
      </div>
      <div className="max-h-52 overflow-y-auto divide-y divide-border">
        {items.slice(0, 12).map((item, i) => (
          <button
            key={i}
            onClick={() => {
              onJump();
              onClose();
            }}
            className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors group"
          >
            <div className="text-xs font-medium text-foreground group-hover:text-amber-400 transition-colors truncate">
              {item.label}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {item.reason}
            </div>
          </button>
        ))}
        {items.length > 12 && (
          <div className="px-3 py-2 text-[10px] text-muted-foreground">
            +{items.length - 12} more — go to tab to see all
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-t border-border bg-secondary/30">
        <button
          onClick={() => {
            onJump();
            onClose();
          }}
          className="w-full text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors text-center"
        >
          Go to tab to review →
        </button>
      </div>
    </div>
  );
}

// ── Tab progress percentages ─────────────────────────────────────────────
function useTabProgress() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();

  // Coding: % of patterns rated ≥ 3
  const codingPct = Math.round(
    (PATTERNS.filter(p => (patternRatings[p.id] ?? 0) >= 3).length /
      PATTERNS.length) *
      100
  );

  // Behavioral: % of BQs rated ≥ 3
  const behavioralPct = Math.round(
    (BEHAVIORAL_QUESTIONS.filter(q => (bqRatings[q.id] ?? 0) >= 3).length /
      BEHAVIORAL_QUESTIONS.length) *
      100
  );

  // Overview: composite of coding + behavioral
  const overviewPct = Math.round((codingPct + behavioralPct) / 2);

  return { codingPct, behavioralPct, overviewPct };
}

// ── Tab badge counters ─────────────────────────────────────────────────────
function useTabBadgeCounts() {
  const [srDue] = useSpacedRepetition();
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [flashCardSRDue] = useFlashCardSRDue();
  const [dailyChecklist] = useDailyChecklist();
  const today = new Date().toISOString().split("T")[0];

  const codingSRDuePatterns = PATTERNS.filter(
    p => srDue[p.id] && srDue[p.id] <= today
  );
  const weakPatternsList = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) > 0 && (patternRatings[p.id] ?? 0) <= 2
  );
  const codingItemsMap = new Map<string, { label: string; reason: string }>();
  for (const p of codingSRDuePatterns)
    codingItemsMap.set(p.id, { label: p.name, reason: "SR review due" });
  for (const p of weakPatternsList) {
    if (!codingItemsMap.has(p.id))
      codingItemsMap.set(p.id, {
        label: p.name,
        reason: `Rated ${patternRatings[p.id] ?? 0}/5 — needs practice`,
      });
    else
      codingItemsMap.set(p.id, {
        label: p.name,
        reason: `SR due + rated ${patternRatings[p.id] ?? 0}/5`,
      });
  }
  const codingItems = Array.from(codingItemsMap.values());
  const codingDue = codingItems.length;

  const behavioralSRDueBQs = BEHAVIORAL_QUESTIONS.filter(
    q => srDue[q.id] && srDue[q.id] <= today
  );
  const weakBQsList = BEHAVIORAL_QUESTIONS.filter(
    q => (bqRatings[q.id] ?? 0) > 0 && (bqRatings[q.id] ?? 0) <= 2
  );
  const behavioralItemsMap = new Map<
    string,
    { label: string; reason: string }
  >();
  for (const q of behavioralSRDueBQs)
    behavioralItemsMap.set(q.id, {
      label: q.q.length > 50 ? q.q.slice(0, 50) + "…" : q.q,
      reason: "SR review due",
    });
  for (const q of weakBQsList) {
    if (!behavioralItemsMap.has(q.id))
      behavioralItemsMap.set(q.id, {
        label: q.q.length > 50 ? q.q.slice(0, 50) + "…" : q.q,
        reason: `Rated ${bqRatings[q.id] ?? 0}/5 — needs practice`,
      });
    else
      behavioralItemsMap.set(q.id, {
        label: q.q.length > 50 ? q.q.slice(0, 50) + "…" : q.q,
        reason: `SR due + rated ${bqRatings[q.id] ?? 0}/5`,
      });
  }
  const behavioralItems = Array.from(behavioralItemsMap.values());
  const behavioralDue = behavioralItems.length;

  const flashCardDue = Object.values(flashCardSRDue).filter(
    d => d <= today
  ).length;
  void dailyChecklist;

  return {
    codingDue,
    behavioralDue,
    flashCardDue,
    codingItems,
    behavioralItems,
  };
}

// ── Density Selector ───────────────────────────────────────────────────────
function DensitySelector() {
  const [density, setDensity] = useDensity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Apply density class to root
  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  const options: { value: Density; label: string; desc: string }[] = [
    {
      value: "compact",
      label: "S",
      desc: "Compact — more content, less spacing",
    },
    { value: "comfortable", label: "M", desc: "Comfortable — default spacing" },
    { value: "spacious", label: "L", desc: "Spacious — relaxed reading" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Layout density"
        className="flex items-center gap-1 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-xs font-semibold"
      >
        <AlignJustify size={13} />
        <span className="hidden sm:inline">
          {density === "compact" ? "S" : density === "comfortable" ? "M" : "L"}
        </span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-[200] w-52 rounded-xl border border-border bg-background shadow-xl shadow-black/30 overflow-hidden">
          <div className="px-3 py-2 bg-secondary/40 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Layout Density
          </div>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                setDensity(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-secondary transition-colors ${density === opt.value ? "bg-blue-500/10" : ""}`}
            >
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold border ${density === opt.value ? "bg-blue-500 border-blue-500 text-white" : "border-border text-muted-foreground"}`}
              >
                {opt.label}
              </span>
              <span className="text-xs text-foreground">{opt.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Topic Roulette ─────────────────────────────────────────────────────────
function TopicRoulette({
  onTabChange,
}: {
  onTabChange: (tab: string) => void;
}) {
  const [spinning, setSpinning] = useState(false);

  const ROULETTE_TOPICS = [
    ...PATTERNS.map(p => ({ label: p.name, tab: "coding", emoji: "💻" })),
    ...BEHAVIORAL_QUESTIONS.slice(0, 20).map(q => ({
      label: q.q.length > 40 ? q.q.slice(0, 40) + "…" : q.q,
      tab: "behavioral",
      emoji: "🎯",
    })),
    { label: "Design a URL Shortener", tab: "design", emoji: "🏗️" },
    { label: "Design Instagram Feed", tab: "design", emoji: "🏗️" },
    { label: "Design a Rate Limiter", tab: "design", emoji: "🏗️" },
    { label: "Design Distributed Cache", tab: "design", emoji: "🏗️" },
  ];

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setTimeout(() => {
      const pick =
        ROULETTE_TOPICS[Math.floor(Math.random() * ROULETTE_TOPICS.length)];
      setSpinning(false);
      onTabChange(pick.tab);
      toast(`${pick.emoji} Topic Roulette — Your challenge: ${pick.label}`, {
        duration: 6000,
      });
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, onTabChange]);

  return (
    <button
      onClick={spin}
      disabled={spinning}
      title="Topic Roulette — spin for a random challenge"
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-all ${spinning ? "text-purple-400 bg-purple-500/10 border border-purple-500/30 animate-pulse" : "text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 hover:border hover:border-purple-500/20"}`}
    >
      <Dices size={13} className={spinning ? "animate-spin" : ""} />
      <span className="hidden sm:inline">Roulette</span>
    </button>
  );
}

// ── Gauntlet Mode ──────────────────────────────────────────────────────────
const GAUNTLET_TABS = ["overview", "coding", "behavioral", "design", "collab"];

function GauntletButton({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const [gauntlet, setGauntlet] = useGauntletState();
  const [elapsed, setElapsed] = useState(0);

  // Timer tick
  useEffect(() => {
    if (!gauntlet.active || !gauntlet.startedAt) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - gauntlet.startedAt!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [gauntlet.active, gauntlet.startedAt]);

  // Auto-mark tab as completed when user visits it during gauntlet
  useEffect(() => {
    if (!gauntlet.active) return;
    if (gauntlet.tabsCompleted.includes(activeTab)) return;
    const updated = [...gauntlet.tabsCompleted, activeTab];
    if (updated.length >= GAUNTLET_TABS.length) {
      // All tabs visited — gauntlet complete!
      const totalMs = Date.now() - (gauntlet.startedAt ?? Date.now());
      const prev = gauntlet.bestTimeMs;
      const isNewBest = prev === null || totalMs < prev;
      setGauntlet({
        active: false,
        startedAt: null,
        tabsCompleted: [],
        bestTimeMs: isNewBest ? totalMs : prev,
      });
      const mins = Math.floor(totalMs / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      toast(
        `🏆 Gauntlet Complete! All ${GAUNTLET_TABS.length} tabs in ${mins}m ${secs}s${isNewBest ? " — New best time! 🎉" : ""}`,
        { duration: 8000 }
      );
    } else {
      setGauntlet(g => ({ ...g, tabsCompleted: updated }));
    }
  }, [activeTab, gauntlet.active]);

  const startGauntlet = () => {
    setGauntlet({
      active: true,
      startedAt: Date.now(),
      tabsCompleted: [activeTab],
      bestTimeMs: gauntlet.bestTimeMs,
    });
    onTabChange("overview");
    toast(
      "⚔️ Gauntlet Mode Started! Visit all 5 tabs without stopping. Timer is running!",
      { duration: 5000 }
    );
  };

  const stopGauntlet = () => {
    setGauntlet(g => ({
      ...g,
      active: false,
      startedAt: null,
      tabsCompleted: [],
    }));
    toast("Gauntlet cancelled — your best time is preserved.", {
      duration: 3000,
    });
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (gauntlet.active) {
    const remaining = GAUNTLET_TABS.filter(
      t => !gauntlet.tabsCompleted.includes(t)
    );
    return (
      <button
        onClick={stopGauntlet}
        title={`Gauntlet active — ${gauntlet.tabsCompleted.length}/${GAUNTLET_TABS.length} tabs done. Click to cancel.`}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-all"
      >
        <Swords size={13} className="animate-pulse" />
        <span className="hidden sm:inline">{fmt(elapsed)}</span>
        <span className="text-[10px] opacity-70 hidden sm:inline">
          ({gauntlet.tabsCompleted.length}/{GAUNTLET_TABS.length})
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={startGauntlet}
      title={
        gauntlet.bestTimeMs
          ? `Gauntlet Mode — Best: ${fmt(Math.floor(gauntlet.bestTimeMs / 1000))}`
          : "Gauntlet Mode — visit all 5 tabs in one run"
      }
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10 hover:border hover:border-orange-500/20 transition-all"
    >
      <Swords size={13} />
      <span className="hidden sm:inline">Gauntlet</span>
      {gauntlet.bestTimeMs && (
        <span className="hidden sm:inline text-[10px] text-orange-400/70">
          {fmt(Math.floor(gauntlet.bestTimeMs / 1000))}
        </span>
      )}
    </button>
  );
}

// ── Study Soundtrack ───────────────────────────────────────────────────────
const SOUNDTRACK_OPTIONS: {
  value: SoundtrackTrack;
  label: string;
  url: string;
  emoji: string;
}[] = [
  { value: "off", label: "Off", url: "", emoji: "🔇" },
  {
    value: "lofi",
    label: "Lo-fi Beats",
    url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&loop=1&playlist=jfKfPfyJRdk",
    emoji: "🎵",
  },
  {
    value: "focus",
    label: "Focus Flow",
    url: "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&loop=1&playlist=5qap5aO4i9A",
    emoji: "🎧",
  },
  {
    value: "nature",
    label: "Nature Sounds",
    url: "https://www.youtube.com/embed/eKFTSSKCzWA?autoplay=1&loop=1&playlist=eKFTSSKCzWA",
    emoji: "🌿",
  },
];

function StudySoundtrack() {
  const [track, setTrack] = useSoundtrack();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current =
    SOUNDTRACK_OPTIONS.find(o => o.value === track) ?? SOUNDTRACK_OPTIONS[0];
  const isPlaying = track !== "off";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title={
          isPlaying
            ? `Playing: ${current.label} — click to change`
            : "Study Soundtrack — ambient music while you prep"
        }
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-all ${isPlaying ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30" : "text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"}`}
      >
        <Music size={13} className={isPlaying ? "animate-pulse" : ""} />
        <span className="hidden sm:inline">
          {isPlaying ? current.label : "Music"}
        </span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-[200] w-52 rounded-xl border border-border bg-background shadow-xl shadow-black/30 overflow-hidden">
          <div className="px-3 py-2 bg-secondary/40 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Study Soundtrack
          </div>
          {SOUNDTRACK_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                setTrack(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-secondary transition-colors ${track === opt.value ? "bg-emerald-500/10" : ""}`}
            >
              <span className="text-base">{opt.emoji}</span>
              <span
                className={`text-xs ${track === opt.value ? "text-emerald-400 font-semibold" : "text-foreground"}`}
              >
                {opt.label}
              </span>
              {track === opt.value && (
                <span className="ml-auto text-emerald-400 text-[10px]">
                  ▶ playing
                </span>
              )}
            </button>
          ))}
          <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground">
            Audio plays via YouTube embed (muted tab allowed)
          </div>
        </div>
      )}
      {/* Hidden YouTube iframe for audio */}
      {isPlaying && current.url && (
        <iframe
          ref={iframeRef}
          src={current.url}
          className="hidden"
          allow="autoplay"
          title="Study soundtrack"
        />
      )}
    </div>
  );
}

export default function TopNav({
  activeTab,
  onTabChange,
  darkMode: _darkModeProp,
  onToggleDark: _onToggleDarkProp,
}: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const onToggleDark = toggleTheme ?? (() => {});
  const streak = useStreak();
  const { user } = useAuth();
  const { data: ownerData } = trpc.auth.isOwner.useQuery(undefined, {
    enabled: !!user,
  });
  const isOwner = ownerData?.isOwner ?? false;

  // Feedback badge: show red dot on admin icon when there are recent items
  const { data: feedbackStats } = trpc.feedback.adminStats.useQuery(undefined, {
    enabled: isOwner,
    refetchInterval: 5 * 60 * 1000, // re-check every 5 minutes
    staleTime: 2 * 60 * 1000,
  });
  const newFeedbackCount = feedbackStats?.newCount ?? 0;
  const {
    codingDue,
    behavioralDue,
    flashCardDue,
    codingItems,
    behavioralItems,
  } = useTabBadgeCounts();
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const { codingPct, behavioralPct, overviewPct } = useTabProgress();

  const TABS = [
    {
      id: "overview",
      label: "Overview",
      due: 0,
      pct: overviewPct,
      items: [] as { label: string; reason: string }[],
    },
    {
      id: "coding",
      label: "Drill Patterns",
      due: codingDue,
      pct: codingPct,
      items: codingItems,
    },
    {
      id: "behavioral",
      label: "Tell Stories",
      due: behavioralDue,
      pct: behavioralPct,
      items: behavioralItems,
    },
    {
      id: "design",
      label: "System Design",
      due: flashCardDue,
      pct: null,
      items: [],
    },
    { id: "collab", label: "Collab", due: 0, pct: null, items: [] },
    { id: "practice", label: "Practice", due: 0, pct: null, items: [] },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span
              className="font-bold text-sm text-foreground hidden sm:inline"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Staff Eng Prep
            </span>
            <span className="badge badge-blue hidden md:inline-flex">
              L4–L7
            </span>
          </div>

          {/* Tabs — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
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
                  <span className="flex flex-col items-center gap-0.5">
                    <span>{tab.label}</span>
                    {tab.pct !== null && tab.pct !== undefined && (
                      <span className="w-full h-0.5 rounded-full bg-secondary overflow-hidden">
                        <span
                          className={`block h-full rounded-full transition-all duration-700 ${
                            tab.pct >= 80
                              ? "bg-emerald-500"
                              : tab.pct >= 40
                                ? "bg-blue-500"
                                : "bg-amber-500"
                          }`}
                          style={{ width: `${tab.pct}%` }}
                        />
                      </span>
                    )}
                  </span>
                  {tab.due > 0 && (
                    <span
                      onClick={e => {
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
                {openPopover === tab.id && tab.items.length > 0 && (
                  <BadgePopover
                    title={`${tab.due} item${tab.due !== 1 ? "s" : ""} need attention`}
                    items={tab.items}
                    onJump={() => onTabChange(tab.id)}
                    onClose={() => setOpenPopover(null)}
                  />
                )}
                {openPopover === tab.id &&
                  tab.items.length === 0 &&
                  tab.due > 0 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[200] px-3 py-2 rounded-lg border border-border bg-background shadow-lg text-xs text-muted-foreground whitespace-nowrap">
                      {tab.due} flash card{tab.due !== 1 ? "s" : ""} due for SR
                      review
                    </div>
                  )}
              </div>
            ))}
          </nav>

          {/* Right toolbar */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Interview day countdown */}
            <CountdownPill onTabChange={onTabChange} />

            {/* Density selector */}
            <DensitySelector />

            {/* Topic Roulette */}
            <TopicRoulette onTabChange={onTabChange} />

            {/* Gauntlet Mode */}
            <GauntletButton activeTab={activeTab} onTabChange={onTabChange} />

            {/* Study Soundtrack */}
            <StudySoundtrack />

            {/* Streak */}
            <div
              className={`streak-badge text-sm ${streak.currentStreak === 0 ? "broken" : ""}`}
              title={`Longest streak: ${streak.longestStreak} days`}
            >
              <span>{streak.currentStreak > 0 ? "🔥" : "💤"}</span>
              <span>{streak.currentStreak}d</span>
            </div>

            {/* Admin Panel — owner only (live app) OR always visible in standalone */}
            {(isOwner || import.meta.env.VITE_STANDALONE === "true") && (
              <>
                <a
                  href={
                    import.meta.env.VITE_STANDALONE === "true"
                      ? "#/admin"
                      : "/admin/feedback"
                  }
                  title={
                    import.meta.env.VITE_STANDALONE === "true"
                      ? "Admin Panel (PIN required)"
                      : newFeedbackCount > 0
                        ? `Admin Panel · ${newFeedbackCount} new in last 7 days`
                        : "Admin Panel"
                  }
                  className="relative w-8 h-8 rounded-md flex items-center justify-center text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
                >
                  <ShieldCheck size={15} />
                  {!import.meta.env.VITE_STANDALONE && newFeedbackCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 ring-1 ring-background flex items-center justify-center text-[9px] font-bold text-white leading-none">
                      {newFeedbackCount > 99 ? "99+" : newFeedbackCount}
                    </span>
                  )}
                </a>
                {/* Re-lock admin — clears in-memory token so PIN gate re-appears (live app only) */}
                {!import.meta.env.VITE_STANDALONE && isOwner && (
                  <button
                    onClick={() => {
                      clearAdminToken();
                      window.location.href = "/admin/feedback";
                    }}
                    title="Re-lock admin panel (requires PIN re-entry)"
                    className="w-8 h-8 rounded-md flex items-center justify-center text-violet-400/50 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
                  >
                    <KeyRound size={13} />
                  </button>
                )}
              </>
            )}
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
          {TABS.map(tab => (
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
          <CountdownPill onTabChange={onTabChange} />
        </div>
      </div>
    </header>
  );
}
