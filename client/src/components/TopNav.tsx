// Design: Bold Engineering Dashboard — dark charcoal, Space Grotesk, blue accent
import { Sun, Moon, BookOpen } from "lucide-react";
import { useStreak } from "@/hooks/useLocalStorage";

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const TABS = [
  { id: "overview",   label: "Overview" },
  { id: "coding",     label: "Coding" },
  { id: "behavioral", label: "Behavioral" },
  { id: "design",     label: "System Design" },
];

export default function TopNav({ activeTab, onTabChange, darkMode, onToggleDark }: TopNavProps) {
  const streak = useStreak();

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
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right: streak + dark toggle */}
          <div className="flex items-center gap-2 shrink-0">
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
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
