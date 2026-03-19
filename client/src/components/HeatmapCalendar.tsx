import { useMemo } from "react";
import { Flame } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DayActivity {
  date: string;       // YYYY-MM-DD
  drills: number;
  mocks: number;
  stories: number;
  total: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getLast60Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
}

function readActivityLog(): Record<string, { drills: number; mocks: number; stories: number }> {
  try {
    return JSON.parse(localStorage.getItem("meta_prep_activity_log") ?? "{}");
  } catch {
    return {};
  }
}

function getIntensityClass(total: number): string {
  if (total === 0) return "bg-secondary border border-border/50";
  if (total <= 2)  return "bg-emerald-900/60 border border-emerald-800/60";
  if (total <= 5)  return "bg-emerald-700/70 border border-emerald-600/50";
  if (total <= 9)  return "bg-emerald-500/80 border border-emerald-400/50";
  return "bg-emerald-400 border border-emerald-300/70";
}

function getIntensityLabel(total: number): string {
  if (total === 0) return "No activity";
  if (total <= 2)  return "Light";
  if (total <= 5)  return "Moderate";
  if (total <= 9)  return "Active";
  return "Intense";
}

// ── Public API for recording activity (called from other components) ──────────
export function recordActivity(type: "drill" | "mock" | "story", count = 1) {
  const log = readActivityLog();
  const today = toDateKey(new Date());
  if (!log[today]) log[today] = { drills: 0, mocks: 0, stories: 0 };
  if (type === "drill")  log[today].drills  += count;
  if (type === "mock")   log[today].mocks   += count;
  if (type === "story")  log[today].stories += count;
  localStorage.setItem("meta_prep_activity_log", JSON.stringify(log));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HeatmapCalendar() {
  const days = useMemo(() => getLast60Days(), []);
  const log  = useMemo(() => readActivityLog(), []);

  const activity: DayActivity[] = days.map(date => {
    const entry = log[date] ?? { drills: 0, mocks: 0, stories: 0 };
    return { date, ...entry, total: entry.drills + entry.mocks + entry.stories };
  });

  const activeDays   = activity.filter(d => d.total > 0).length;
  const totalDrills  = activity.reduce((s, d) => s + d.drills, 0);
  const totalMocks   = activity.reduce((s, d) => s + d.mocks, 0);
  const totalStories = activity.reduce((s, d) => s + d.stories, 0);

  // Streak calculation
  const streak = useMemo(() => {
    let s = 0;
    const today = toDateKey(new Date());
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      if (key === today && (log[key]?.drills ?? 0) + (log[key]?.mocks ?? 0) + (log[key]?.stories ?? 0) === 0) {
        // today with no activity — don't break streak yet
        continue;
      }
      const total = (log[key]?.drills ?? 0) + (log[key]?.mocks ?? 0) + (log[key]?.stories ?? 0);
      if (total > 0) s++;
      else break;
    }
    return s;
  }, [log]);

  // Group into weeks (columns of 7)
  const weeks: DayActivity[][] = [];
  for (let i = 0; i < activity.length; i += 7) {
    weeks.push(activity.slice(i, i + 7));
  }

  // Month labels
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = "";
  weeks.forEach((week, wi) => {
    const month = new Date(week[0].date).toLocaleString("default", { month: "short" });
    if (month !== lastMonth) {
      monthLabels.push({ label: month, col: wi });
      lastMonth = month;
    }
  });

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Flame size={15} className="text-orange-400" />
          <span className="section-title text-sm mb-0 pb-0 border-0">60-Day Activity Calendar</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="text-orange-400 font-bold text-sm">🔥 {streak}</span>
            <span>day streak</span>
          </span>
          <span><span className="text-foreground font-semibold">{activeDays}</span> active days</span>
          <span><span className="text-blue-400 font-semibold">{totalDrills}</span> drills</span>
          <span><span className="text-purple-400 font-semibold">{totalMocks}</span> mocks</span>
          <span><span className="text-amber-400 font-semibold">{totalStories}</span> stories</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-max">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.col === wi);
              return (
                <div key={wi} className="w-7 mr-1 text-xs text-muted-foreground">
                  {ml ? ml.label : ""}
                </div>
              );
            })}
          </div>

          {/* Grid rows (day of week) */}
          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              {dayLabels.map((d, i) => (
                <div key={d} className={`h-5 w-6 text-right text-xs text-muted-foreground leading-5 ${i % 2 === 0 ? "opacity-0" : ""}`}>
                  {d.slice(0, 1)}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1 mr-1">
                {week.map((day, di) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.total === 0 ? "No activity" : `${day.total} activities (${day.drills} drills, ${day.mocks} mocks, ${day.stories} stories)`}`}
                    className={`w-5 h-5 rounded-sm cursor-default transition-all hover:scale-125 hover:z-10 relative ${getIntensityClass(day.total)}`}
                    aria-label={`${day.date}: ${getIntensityLabel(day.total)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 2, 5, 8, 12].map(v => (
          <div key={v} className={`w-4 h-4 rounded-sm ${getIntensityClass(v)}`} />
        ))}
        <span>More</span>
        <span className="ml-auto text-xs text-muted-foreground/60">Hover a cell for details</span>
      </div>

      {/* Empty state hint */}
      {activeDays === 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          <p>No activity recorded yet.</p>
          <p className="mt-1">Complete a Quick Drill, Full Mock, or STAR practice to see your calendar fill up.</p>
        </div>
      )}
    </div>
  );
}
