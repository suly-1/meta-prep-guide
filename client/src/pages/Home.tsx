// Design: Bold Engineering Dashboard
// Dark charcoal base, Space Grotesk headings, Inter body
// Blue (Meta), Emerald (mastered), Amber (weak), Orange (streak)
import { useState, useEffect, useCallback } from "react";
import { usePatternRatings, useBehavioralRatings, useOnboardingDismissed, useDisclaimerDismissed, useCongratsShown } from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";
import TopNav from "@/components/TopNav";
import HeroSection from "@/components/HeroSection";
import CodingTab from "@/components/CodingTab";
import BehavioralTab from "@/components/BehavioralTab";
import OverviewTab from "@/components/OverviewTab";
import SystemDesignTab from "@/components/SystemDesignTab";
import OnboardingModal from "@/components/OnboardingModal";
import NotificationBanner from "@/components/NotificationBanner";
import { AlertTriangle, X } from "lucide-react";

// Simple confetti burst
function triggerConfetti() {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement("div");
    el.style.cssText = `
      position:fixed; top:0; left:${Math.random()*100}vw; width:8px; height:8px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      z-index:9999; pointer-events:none;
      animation: confetti-fall ${1.5 + Math.random()}s ease-in forwards;
      transform: rotate(${Math.random()*360}deg);
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");
  const [darkMode, setDarkMode] = useState(true);
  const [onboardingDismissed, setOnboardingDismissed] = useOnboardingDismissed();
  const [disclaimerDismissed, setDisclaimerDismissed] = useDisclaimerDismissed();
  const [congratsShown, setCongratsShown] = useCongratsShown();
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Confetti check
  useEffect(() => {
    const masteredAll = PATTERNS.every(p => (patternRatings[p.id] ?? 0) >= 4);
    const readyAll = BEHAVIORAL_QUESTIONS.every(q => (bqRatings[q.id] ?? 0) >= 4);
    if ((masteredAll || readyAll) && !congratsShown) {
      triggerConfetti();
      setCongratsShown(true);
    }
  }, [patternRatings, bqRatings, congratsShown, setCongratsShown]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key === "1") setActiveTab("overview");
    if (e.key === "2") setActiveTab("coding");
    if (e.key === "3") setActiveTab("behavioral");
    if (e.key === "4") setActiveTab("design");
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`min-h-screen bg-background text-foreground ${darkMode ? "dark" : ""}`}>
      {/* Confetti keyframe */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* Disclaimer banner */}
      {!disclaimerDismissed && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5">
          <div className="container flex items-start gap-3">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-muted-foreground">
              <span className="font-semibold text-amber-400">Disclaimer: </span>
              This guide is an independent study resource and is not affiliated with, endorsed by, or connected to Meta Platforms, Inc. Interview formats and expectations may change. Always verify current information with your recruiter.
              <label className="ml-3 inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="accent-amber-500" onChange={e => e.target.checked && setDisclaimerDismissed(true)} />
                <span className="text-amber-400 font-medium">I have read the disclaimer</span>
              </label>
            </div>
            <button onClick={() => setDisclaimerDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Top navigation */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />

      {/* Hero section */}
      <HeroSection onTabChange={setActiveTab} />

      {/* Main content */}
      <main className="container py-6">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "coding" && <CodingTab />}
        {activeTab === "behavioral" && <BehavioralTab />}
        {activeTab === "design" && <SystemDesignTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8">
        <div className="container text-center text-xs text-muted-foreground space-y-1">
          <div>Meta IC6/IC7 Interview Prep Guide · All progress saved locally in your browser</div>
          <div>Press <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono">1</kbd>–<kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono">4</kbd> to switch tabs</div>
        </div>
      </footer>

      {/* Onboarding modal */}
      {!onboardingDismissed && <OnboardingModal onDismiss={() => setOnboardingDismissed(true)} />}

      {/* Notification banner */}
      <NotificationBanner />
    </div>
  );
}
