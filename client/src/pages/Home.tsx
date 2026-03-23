// Design: Bold Engineering Dashboard
// Dark charcoal base, Space Grotesk headings, Inter body
// Blue (Meta), Emerald (mastered), Amber (weak), Orange (streak)
import { useState, useEffect, useCallback } from "react";
import {
  usePatternRatings,
  useBehavioralRatings,
  useOnboardingDismissed,
  useDisclaimerDismissed,
  useCongratsShown,
  useInterviewDate,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";
import TopNav, { CountdownBar } from "@/components/TopNav";
import HeroSection from "@/components/HeroSection";
import CommunityBanner from "@/components/CommunityBanner";
import OnboardingModal from "@/components/OnboardingModal";
import { StartHereOnboarding } from "@/components/StartHereOnboarding";
import { GeneralFeedback } from "@/components/GeneralFeedback";
import NotificationBanner from "@/components/NotificationBanner";
import GlobalSearch from "@/components/GlobalSearch";
import {
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
  Keyboard,
  HelpCircle,
  Trash2,
} from "lucide-react";
import DisclaimerGate, { useDisclaimerGate } from "@/components/DisclaimerGate";

// Static imports — dynamic (lazy) imports are incompatible with the standalone
// CDN build because chunk URLs become absolute CDN paths that cannot be resolved
// at runtime. Keep static imports here; bundle splitting is handled by manualChunks
// in vite.config.ts which still produces separate vendor chunks for caching.
import OverviewTab from "@/components/OverviewTab";
import CodingTab from "@/components/CodingTab";
import BehavioralTab from "@/components/BehavioralTab";
import SystemDesignTab from "@/components/SystemDesignTab";
import CodePracticeTab from "@/components/CodePracticeTab";

// Simple confetti burst
function triggerConfetti() {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement("div");
    el.style.cssText = `
      position:fixed; top:0; left:${Math.random() * 100}vw; width:8px; height:8px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      z-index:9999; pointer-events:none;
      animation: confetti-fall ${1.5 + Math.random()}s ease-in forwards;
      transform: rotate(${Math.random() * 360}deg);
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

export default function Home() {
  const {
    gateOpen,
    dbLoading,
    confirm: confirmDisclaimer,
  } = useDisclaimerGate();
  // Deep-link URL routing: ?tab=coding&section=mock
  const VALID_TABS = [
    "overview",
    "coding",
    "behavioral",
    "design",
    "collab",
    "practice",
  ];
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    return t && VALID_TABS.includes(t) ? t : "overview";
  };
  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const setActiveTabWithUrl = (tab: string, section?: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    if (section) params.set("section", section);
    else params.delete("section");
    window.history.replaceState(null, "", "?" + params.toString());
    if (section) {
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  };
  // On mount: scroll to section from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    if (section) {
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, []);
  const [darkMode, setDarkMode] = useState(true);
  const [onboardingDismissed, setOnboardingDismissed] =
    useOnboardingDismissed();
  const [disclaimerDismissed, setDisclaimerDismissed] =
    useDisclaimerDismissed();
  const [congratsShown, setCongratsShown] = useCongratsShown();
  const [interviewDate] = useInterviewDate();
  const daysUntilInterview = interviewDate
    ? Math.ceil(
        (new Date(interviewDate).setHours(0, 0, 0, 0) -
          new Date().setHours(0, 0, 0, 0)) /
          86400000
      )
    : null;
  const [countdownDismissed, setCountdownDismissed] = useState(false);
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [focusMode, setFocusMode] = useState(false);
  const [showKeyHelp, setShowKeyHelp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Confetti check
  useEffect(() => {
    const masteredAll = PATTERNS.every(p => (patternRatings[p.id] ?? 0) >= 4);
    const readyAll = BEHAVIORAL_QUESTIONS.every(
      q => (bqRatings[q.id] ?? 0) >= 4
    );
    if ((masteredAll || readyAll) && !congratsShown) {
      triggerConfetti();
      setCongratsShown(true);
    }
  }, [patternRatings, bqRatings, congratsShown, setCongratsShown]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key === "1") setActiveTabWithUrl("overview");
    if (e.key === "2") setActiveTabWithUrl("coding");
    if (e.key === "3") setActiveTabWithUrl("behavioral");
    if (e.key === "4") setActiveTabWithUrl("design");
    if (e.key === "5") setActiveTabWithUrl("collab");
    if (e.key === "f" || e.key === "F") setFocusMode(m => !m);
    if (e.key === "?") setShowKeyHelp(m => !m);
    if (e.key === "Escape") {
      setFocusMode(false);
      setShowKeyHelp(false);
    }
    // Alt+1–4: trigger primary Quick Action for the current tab
    if (e.altKey && e.key === "1") {
      e.preventDefault();
      const el = document.getElementById("study-session-planner");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (e.altKey && e.key === "2") {
      e.preventDefault();
      const el = document.getElementById("coding-mock-session");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (e.altKey && e.key === "3") {
      e.preventDefault();
      const el = document.getElementById("behavioral-voice-star");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (e.altKey && e.key === "4") {
      e.preventDefault();
      const el = document.getElementById("sysdesign-diagram-templates");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (e.altKey && e.key === "5") {
      e.preventDefault();
      setActiveTabWithUrl("collab");
      setTimeout(() => {
        const el = document.getElementById("collab-create-room");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Show full-screen disclaimer gate until explicitly acknowledged
  // For logged-in users, the DB record is the authoritative source.
  if (gateOpen) {
    return <DisclaimerGate onConfirm={confirmDisclaimer} loading={dbLoading} />;
  }

  return (
    <div
      className={`min-h-screen bg-background text-foreground ${darkMode ? "dark" : ""}`}
    >
      {/* Confetti keyframe */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* Disclaimer banner */}
      {!disclaimerDismissed && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
          <div className="container flex items-start gap-3">
            <AlertTriangle
              size={14}
              className="text-amber-400 shrink-0 mt-0.5"
            />
            <div className="flex-1 text-xs text-muted-foreground">
              <span className="font-semibold text-amber-400">
                Public Community Resource:{" "}
              </span>
              This is an independent, publicly available study guide at{" "}
              <span className="text-blue-400">www.metaguide.blog</span> — not
              affiliated with, endorsed by, or distributed by Meta, Google,
              Amazon, or any FAANG company. It was not provided to you by any
              interviewer or recruiter. Always verify interview details with
              your recruiter.
              <label className="ml-3 inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-amber-500"
                  onChange={e =>
                    e.target.checked && setDisclaimerDismissed(true)
                  }
                />
                <span className="text-amber-400 font-medium">I understand</span>
              </label>
            </div>
            <button
              onClick={() => setDisclaimerDismissed(true)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Top navigation — hidden in focus mode */}
      {!focusMode && (
        <>
          <TopNav
            activeTab={activeTab}
            onTabChange={setActiveTabWithUrl}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(d => !d)}
          />
          <div className="container pb-1 flex justify-end">
            <GlobalSearch onNavigate={setActiveTabWithUrl} />
          </div>
        </>
      )}

      {/* Community resource banner — always visible (not hidden in focus mode) */}
      <CountdownBar onTabChange={setActiveTabWithUrl} />
      <CommunityBanner />
      {/* Hero section — hidden in focus mode */}
      {!focusMode && <HeroSection onTabChange={setActiveTabWithUrl} />}

      {/* Focus Mode bar */}
      {focusMode && (
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-background/90 backdrop-blur border-b border-border">
          <div className="flex items-center gap-2">
            <Maximize2 size={13} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">
              Focus Mode
            </span>
            <span className="text-xs text-muted-foreground">
              — Press{" "}
              <kbd className="px-1 py-0.5 rounded bg-secondary border border-border font-mono text-xs">
                F
              </kbd>{" "}
              or{" "}
              <kbd className="px-1 py-0.5 rounded bg-secondary border border-border font-mono text-xs">
                Esc
              </kbd>{" "}
              to exit
            </span>
          </div>
          <button
            onClick={() => setFocusMode(false)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Minimize2 size={13} /> Exit Focus
          </button>
        </div>
      )}

      {/* Global interview countdown banner — shows on non-Overview tabs when ≤7 days away */}
      {daysUntilInterview !== null &&
        daysUntilInterview <= 7 &&
        daysUntilInterview >= 0 &&
        !countdownDismissed &&
        activeTab !== "overview" && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5">
            <div className="container flex items-center gap-3">
              <AlertTriangle size={13} className="text-amber-400 shrink-0" />
              <span className="text-xs text-amber-300 flex-1">
                <span className="font-bold">
                  Interview in{" "}
                  {daysUntilInterview === 0
                    ? "today"
                    : `${daysUntilInterview} day${daysUntilInterview !== 1 ? "s" : ""}`}
                  !
                </span>{" "}
                Focus on your weakest areas. Check the{" "}
                <button
                  onClick={() => setActiveTabWithUrl("overview")}
                  className="underline hover:text-amber-200 transition-colors"
                >
                  Interview Day Checklist
                </button>
                .
              </span>
              <button
                onClick={() => setCountdownDismissed(true)}
                className="text-amber-400/60 hover:text-amber-300 transition-colors shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}
      {/* Main content */}
      <main className={`container ${focusMode ? "py-4" : "py-6"}`}>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "coding" && <CodingTab />}
        {activeTab === "behavioral" && <BehavioralTab />}
        {activeTab === "design" && <SystemDesignTab />}
        {activeTab === "collab" && <CollabLobby />}
        {activeTab === "practice" && <CodePracticeTab />}
      </main>

      {/* Footer — hidden in focus mode */}
      {!focusMode && (
        <footer className="border-t border-border py-6 mt-8">
          <div className="container text-center text-xs text-muted-foreground space-y-2">
            {/* #2 — Author byline */}
            <div className="font-medium text-foreground/70">
              Engineering Interview Prep
            </div>
            <div>
              By{" "}
              <span className="text-foreground/80 font-medium">
                Community Contributors
              </span>{" "}
              · Published March 2026 · All progress saved locally in your
              browser
            </div>
            {/* #5 — Version E relaxed distribution note */}
            <div className="max-w-xl mx-auto text-[11px] text-muted-foreground/70 leading-relaxed border-t border-border/50 pt-2 mt-1">
              This is a community guide for self-directed learners. If you're a
              recruiter or hiring manager thinking about sharing it — totally
              your call, but it's worth checking your company's guidelines on
              external resources first. This guide works best when candidates
              discover it on their own anyway.
            </div>
            {/* Keyboard shortcuts + Terms link */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1">
              <span>
                Press{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono">
                  1
                </kbd>
                –
                <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono">
                  5
                </kbd>{" "}
                to switch tabs ·{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono">
                  F
                </kbd>{" "}
                Focus Mode
              </span>
              <span className="text-border">·</span>
              {/* #7 — Terms of Use link */}
              <button
                onClick={() => setShowTerms(true)}
                className="text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2 transition-colors"
              >
                Terms of Use
              </button>
            </div>
            <div className="pt-1">
              <button
                onClick={async () => {
                  // Unregister service workers
                  if ("serviceWorker" in navigator) {
                    const registrations =
                      await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(r => r.unregister()));
                  }
                  // Clear all caches
                  if ("caches" in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(k => caches.delete(k)));
                  }
                  window.location.reload();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                title="Unregisters the service worker and clears all cached bundles — fixes stale UI issues"
              >
                <Trash2 size={10} />
                Clear site cache &amp; reload
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Start Here Onboarding Flow */}
      {!onboardingDismissed && (
        <StartHereOnboarding
          onDismiss={() => setOnboardingDismissed(true)}
          onNavigate={setActiveTabWithUrl}
        />
      )}

      {/* General Feedback floating button */}
      <GeneralFeedback />
      {/* Notification banner */}
      <NotificationBanner />

      {/* Keyboard Navigation Overlay */}
      {showKeyHelp && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowKeyHelp(false)}
        >
          <div
            className="bg-background border border-border rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard size={16} className="text-blue-400" />
                <span className="font-bold text-foreground">
                  Keyboard Shortcuts
                </span>
              </div>
              <button
                onClick={() => setShowKeyHelp(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  section: "Navigation",
                  shortcuts: [
                    { key: "1", desc: "Overview tab" },
                    { key: "2", desc: "Coding tab" },
                    { key: "3", desc: "Behavioral tab" },
                    { key: "4", desc: "System Design tab" },
                    { key: "5", desc: "Collab tab" },
                  ],
                },
                {
                  section: "Modes & UI",
                  shortcuts: [
                    { key: "F", desc: "Toggle Focus Mode" },
                    { key: "?", desc: "Show / hide this overlay" },
                    { key: "Esc", desc: "Exit Focus Mode / close overlay" },
                  ],
                },
                {
                  section: "Quick Actions",
                  shortcuts: [
                    { key: "⌥1", desc: "Plan / Resume Today's Session" },
                    { key: "⌥2", desc: "Start Coding Mock" },
                    { key: "⌥3", desc: "Record STAR Answer" },
                    { key: "⌥4", desc: "Open Diagram Template" },
                    { key: "⌥5", desc: "Start Collab Session" },
                  ],
                },
                {
                  section: "Pattern Cards",
                  shortcuts: [
                    { key: "J / K", desc: "Move down / up through patterns" },
                    { key: "Enter", desc: "Expand / collapse pattern" },
                    { key: "R", desc: "Reveal key idea" },
                    { key: "1–5", desc: "Rate current pattern" },
                  ],
                },
                {
                  section: "Drill & Sprint",
                  shortcuts: [
                    { key: "Tab", desc: "Indent in code editor" },
                    { key: "Esc", desc: "Close inline code editor" },
                  ],
                },
              ].map(group => (
                <div key={group.section}>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    {group.section}
                  </div>
                  <div className="space-y-1.5">
                    {group.shortcuts.map(s => (
                      <div key={s.key} className="flex items-center gap-2">
                        <kbd className="px-2 py-0.5 rounded bg-secondary border border-border font-mono text-xs text-foreground shrink-0 min-w-[2.5rem] text-center">
                          {s.key}
                        </kbd>
                        <span className="text-xs text-muted-foreground">
                          {s.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground text-center">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono">
                ?
              </kbd>{" "}
              or{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono">
                Esc
              </kbd>{" "}
              to close
            </div>
          </div>
        </div>
      )}

      {/* Terms of Use Modal (#7) */}
      {showTerms && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowTerms(false)}
        >
          <div
            className="bg-background border border-border rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-base font-bold text-foreground"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Terms of Use
              </h2>
              <button
                onClick={() => setShowTerms(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <div>
                <p className="text-foreground font-semibold mb-1">
                  What this guide is
                </p>
                <p>
                  Engineering Interview Prep is a free, community-created study
                  resource. It was built by engineers who went through the
                  process and wanted to share what they learned. It is not
                  affiliated with Meta, Google, Amazon, Apple, Netflix, or any
                  other company.
                </p>
              </div>

              <div>
                <p className="text-foreground font-semibold mb-1">
                  Who it's for
                </p>
                <p>
                  This guide is designed for self-directed learners — people who
                  found it on their own and are using it for their own interview
                  preparation. It works best when candidates discover it
                  independently and use it alongside the official materials
                  their recruiter has shared.
                </p>
              </div>

              <div>
                <p className="text-foreground font-semibold mb-1">
                  A note for recruiters and hiring managers
                </p>
                <p>
                  This is a community guide for self-directed learners. If
                  you're a recruiter or hiring manager thinking about sharing it
                  — totally your call, but it's worth checking your company's
                  guidelines on external resources first. This guide works best
                  when candidates discover it on their own anyway.
                </p>
              </div>

              <div>
                <p className="text-foreground font-semibold mb-1">
                  No guarantees
                </p>
                <p>
                  Interview formats change. This guide reflects community
                  knowledge as of March 2026. Always verify current expectations
                  with your recruiter. This guide is provided as-is, without
                  warranty of any kind.
                </p>
              </div>

              <div>
                <p className="text-foreground font-semibold mb-1">Your data</p>
                <p>
                  All your progress (ratings, stories, mock history) is stored
                  locally in your browser. Nothing is sent to any server without
                  your explicit action. The optional leaderboard and
                  cross-device sync features use Supabase and are entirely
                  opt-in.
                </p>
              </div>

              <div className="pt-2 border-t border-border text-[10px] text-muted-foreground/60">
                By Community Contributors · Published March 2026 ·
                www.metaguide.blog
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline lobby component — redirects to /room/:id
function CollabLobby() {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const generateId = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const handleCreate = () => {
    if (!name.trim()) return;
    const id = generateId();
    window.location.href = `/room/${id}?name=${encodeURIComponent(name.trim())}`;
  };
  const handleJoin = () => {
    if (!name.trim() || !roomId.trim()) return;
    window.location.href = `/room/${roomId.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`;
  };
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="space-y-4">
      {/* Quick Actions sticky row */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-background/90 backdrop-blur-sm border-b border-border flex items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:block">
          Quick Actions
        </span>
        <div className="flex gap-2 flex-1 flex-wrap">
          <button
            onClick={() => scrollTo("collab-create-room")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Start Collab Session
          </button>
          <button
            onClick={() => scrollTo("hero-leaderboard")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            View Leaderboard
          </button>
        </div>
        <button
          onClick={() =>
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "?", bubbles: true })
            )
          }
          title="Keyboard shortcuts (?)"
          className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0"
        >
          <HelpCircle size={13} />
        </button>
      </div>
      <div id="collab-create-room" className="max-w-md mx-auto space-y-4">
        <div className="prep-card p-6">
          <div className="section-title text-blue-400 mb-4">
            🤝 Collaborative Mock Interview
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Practice system design interviews with a partner in real-time. One
            person acts as the interviewer, the other as the candidate. Share a
            whiteboard, chat, and score each other's performance.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Your display name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alice"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-semibold transition-all"
            >
              Create New Room
            </button>
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                or join existing
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex gap-2">
              <input
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                placeholder="Room code (e.g. AB12CD)"
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 font-mono tracking-widest"
              />
              <button
                onClick={handleJoin}
                disabled={!name.trim() || !roomId.trim()}
                className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border disabled:opacity-40 text-sm font-semibold text-foreground transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>
        <div className="prep-card p-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            How it works
          </div>
          <div className="space-y-2">
            {[
              [
                "1",
                "Create a room and share the 6-character code with your partner",
              ],
              [
                "2",
                "One person picks a system design question; the other answers",
              ],
              ["3", "Use the shared whiteboard to draw diagrams together"],
              ["4", "Chat in real-time and score each other at the end"],
            ].map(([n, t]) => (
              <div
                key={n}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {n}
                </span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
