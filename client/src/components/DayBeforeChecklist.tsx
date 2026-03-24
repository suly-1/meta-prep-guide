/**
 * "Day Before" Checklist
 * 24-hour countdown checklist: logistics, mental prep, last-minute review.
 * Prevents the 5% of rejections caused by avoidable logistics failures.
 */
import { useState } from "react";
import {
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  category: string;
  text: string;
  detail?: string;
  priority: "critical" | "high" | "medium";
}

const CHECKLIST: ChecklistItem[] = [
  // Logistics
  {
    id: "confirm_time",
    category: "Logistics",
    text: "Confirm interview time and timezone",
    detail:
      "Check your calendar invite. Meta interviews are often PST — convert to your local time.",
    priority: "critical",
  },
  {
    id: "test_tech",
    category: "Logistics",
    text: "Test your tech setup (video, audio, internet)",
    detail:
      "Do a test call. Check camera framing, mic quality, and backup internet option.",
    priority: "critical",
  },
  {
    id: "coding_env",
    category: "Logistics",
    text: "Set up your coding environment",
    detail:
      "Know which tool they'll use (CoderPad, HackerRank, shared doc). Practice in it.",
    priority: "critical",
  },
  {
    id: "quiet_space",
    category: "Logistics",
    text: "Secure a quiet, distraction-free space",
    detail: "Notify housemates. Silence phone. Close unnecessary browser tabs.",
    priority: "high",
  },
  {
    id: "water_snacks",
    category: "Logistics",
    text: "Prepare water and light snacks",
    detail: "A 5-hour loop is exhausting. Keep water on your desk.",
    priority: "medium",
  },

  // Mental Prep
  {
    id: "sleep",
    category: "Mental Prep",
    text: "Get 7-8 hours of sleep tonight",
    detail:
      "Sleep is the #1 cognitive performance lever. No late-night cramming.",
    priority: "critical",
  },
  {
    id: "light_review",
    category: "Mental Prep",
    text: "Do a light 30-min review only (no new topics)",
    detail:
      "Review your 3 strongest STAR stories and 2-3 pattern templates. Nothing new.",
    priority: "high",
  },
  {
    id: "warm_up_plan",
    category: "Mental Prep",
    text: "Plan a 15-min morning warm-up for interview day",
    detail:
      "Use the Daily Warm-Up Routine tool. Do it 1 hour before your first round.",
    priority: "high",
  },
  {
    id: "mindset",
    category: "Mental Prep",
    text: "Reframe: you're evaluating them too",
    detail:
      "Anxiety drops when you're curious, not desperate. Prepare 2-3 questions to ask them.",
    priority: "medium",
  },

  // Content Review
  {
    id: "star_stories",
    category: "Content Review",
    text: "Read your top 3 STAR stories out loud",
    detail:
      "Hearing yourself say them builds recall. Time each one (target: 90-120 seconds).",
    priority: "critical",
  },
  {
    id: "meta_values",
    category: "Content Review",
    text: "Review Meta's core values and your examples for each",
    detail: "Move Fast, Be Bold, Focus on Impact, Be Open, Build Social Value.",
    priority: "high",
  },
  {
    id: "why_meta",
    category: "Content Review",
    text: "Practice your 'Why Meta' answer one more time",
    detail:
      "Use your story from the Why Meta Story Builder. Keep it under 90 seconds.",
    priority: "high",
  },
  {
    id: "patterns",
    category: "Content Review",
    text: "Skim your 3 weakest pattern templates",
    detail:
      "Don't try to master them now. Just refresh the approach and key edge cases.",
    priority: "high",
  },
  {
    id: "system_design_framework",
    category: "Content Review",
    text: "Review your system design framework (RESHADED or similar)",
    detail:
      "Requirements → Estimation → Schema → High-Level → APIs → Deep Dive → Edge Cases.",
    priority: "medium",
  },

  // Day-Of Prep
  {
    id: "eat_well",
    category: "Day-Of",
    text: "Eat a proper meal 2 hours before",
    detail:
      "Blood sugar stability = cognitive stability. Avoid heavy or unfamiliar foods.",
    priority: "high",
  },
  {
    id: "arrive_early",
    category: "Day-Of",
    text: "Join the call 5 minutes early",
    detail: "Tests your setup one final time. Shows professionalism.",
    priority: "high",
  },
  {
    id: "think_aloud_reminder",
    category: "Day-Of",
    text: "Remind yourself: think out loud from the first second",
    detail:
      "Silence is the #1 coding round killer. Narrate your thinking before writing code.",
    priority: "critical",
  },
  {
    id: "clarify_first",
    category: "Day-Of",
    text: "Remind yourself: clarify before coding",
    detail:
      "Ask 2-3 clarifying questions. Confirm constraints. Confirm expected output format.",
    priority: "critical",
  },
];

const PRIORITY_CONFIG = {
  critical: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Critical",
  },
  high: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "High",
  },
  medium: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Medium",
  },
};

const CATEGORIES = ["Logistics", "Mental Prep", "Content Review", "Day-Of"];

export function DayBeforeChecklist() {
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalItems = CHECKLIST.length;
  const completedItems = checked.size;
  const pct = Math.round((completedItems / totalItems) * 100);

  const criticalUnchecked = CHECKLIST.filter(
    item => item.priority === "critical" && !checked.has(item.id)
  ).length;

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-indigo-500/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <CalendarCheck size={16} className="text-indigo-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground">
              "Day Before" Checklist
            </div>
            <div className="text-xs text-muted-foreground">
              18 items to prevent avoidable failures. {completedItems}/
              {totalItems} complete.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalUnchecked > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-medium">
              {criticalUnchecked} critical left
            </span>
          )}
          {criticalUnchecked === 0 && completedItems > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
              {pct}% done
            </span>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-indigo-500/20">
          {/* Progress bar */}
          <div className="mt-4 mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>
                {completedItems} of {totalItems} items complete
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {CATEGORIES.map(category => {
            const items = CHECKLIST.filter(item => item.category === category);
            const catCompleted = items.filter(item =>
              checked.has(item.id)
            ).length;

            return (
              <div key={category} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-foreground">
                    {category}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {catCompleted}/{items.length}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {items.map(item => {
                    const isChecked = checked.has(item.id);
                    const isExpanded = expandedItem === item.id;
                    const config = PRIORITY_CONFIG[item.priority];

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border transition-all ${
                          isChecked
                            ? "border-emerald-500/20 bg-emerald-500/5 opacity-60"
                            : "border-border bg-secondary/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 px-3 py-2">
                          <button
                            onClick={() => toggle(item.id)}
                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isChecked ? (
                              <CheckSquare
                                size={16}
                                className="text-emerald-400"
                              />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() =>
                              setExpandedItem(isExpanded ? null : item.id)
                            }
                          >
                            <div
                              className={`text-sm ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}
                            >
                              {item.text}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded border ${config.bg} ${config.color} ${config.border} shrink-0`}
                          >
                            {config.label}
                          </span>
                        </div>
                        {isExpanded && item.detail && (
                          <div className="px-9 pb-2 text-xs text-muted-foreground">
                            {item.detail}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {pct === 100 && (
            <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-sm font-semibold text-emerald-300">
                You're fully prepared. Go get that offer.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
