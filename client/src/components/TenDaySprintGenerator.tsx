/**
 * 10-Day Final Sprint Generator
 * AI reads all performance data and generates a personalized day-by-day plan.
 * Closes the "I don't know what to prioritize" failure mode in the final stretch.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Rocket,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  Sun,
  Moon,
  Target,
} from "lucide-react";
import {
  usePatternRatings,
  useBehavioralRatings,
  useStarNotes,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS, META_VALUES } from "@/lib/data";

interface SprintDay {
  day: number;
  title: string;
  morningBlock: string;
  afternoonBlock: string;
  goal: string;
}

const DAY_COLORS = [
  "border-red-500/30 bg-red-500/5",
  "border-orange-500/30 bg-orange-500/5",
  "border-amber-500/30 bg-amber-500/5",
  "border-yellow-500/30 bg-yellow-500/5",
  "border-lime-500/30 bg-lime-500/5",
  "border-green-500/30 bg-green-500/5",
  "border-teal-500/30 bg-teal-500/5",
  "border-cyan-500/30 bg-cyan-500/5",
  "border-blue-500/30 bg-blue-500/5",
  "border-purple-500/30 bg-purple-500/5",
];

export function TenDaySprintGenerator() {
  const [expanded, setExpanded] = useState(false);
  const [daysUntil, setDaysUntil] = useState(10);
  const [targetLevel, setTargetLevel] = useState("L6");
  const [mockSessions, setMockSessions] = useState(0);
  const [sprintDays, setSprintDays] = useState<SprintDay[] | null>(null);

  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [starNotes] = useStarNotes();

  const generateMutation = trpc.ai.generateTenDaySprint.useMutation({
    onSuccess: data => {
      try {
        const parsed = JSON.parse(data.content) as { days: SprintDay[] };
        setSprintDays(parsed.days);
      } catch {
        toast.error("Failed to parse sprint plan");
      }
    },
    onError: () => toast.error("Generation failed — please try again"),
  });

  const handleGenerate = () => {
    // Compute weak patterns
    const weakPatterns = PATTERNS.filter(
      p => (patternRatings[p.id] ?? 0) <= 2
    ).map(p => p.name);

    // Compute weak behavioral areas
    const areaScores: Record<string, number[]> = {};
    BEHAVIORAL_QUESTIONS.forEach(q => {
      if (!areaScores[q.area]) areaScores[q.area] = [];
      areaScores[q.area].push(bqRatings[q.id] ?? 0);
    });
    const weakBehavioralAreas = Object.entries(areaScores)
      .filter(
        ([, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length < 3
      )
      .map(([area]) => area);

    // Compute uncovered meta values
    const coveredValues = new Set(
      Object.values(starNotes)
        .filter(n => n.trim().length > 20)
        .map((_, idx) => {
          const q = BEHAVIORAL_QUESTIONS[idx];
          return q?.area ?? "";
        })
    );
    const uncoveredMetaValues = META_VALUES.filter(
      v => !coveredValues.has(v.name)
    ).map(v => v.name);

    // Avg scores
    const patternScores = PATTERNS.map(p => patternRatings[p.id] ?? 0);
    const avgPatternScore =
      patternScores.length > 0
        ? patternScores.reduce((a, b) => a + b, 0) / patternScores.length
        : 2;

    const bqScores = BEHAVIORAL_QUESTIONS.map(q => bqRatings[q.id] ?? 0);
    const avgBehavioralScore =
      bqScores.length > 0
        ? bqScores.reduce((a, b) => a + b, 0) / bqScores.length
        : 2;

    setSprintDays(null);
    generateMutation.mutate({
      daysUntilInterview: daysUntil,
      targetLevel,
      weakPatterns: weakPatterns.slice(0, 5),
      weakBehavioralAreas: weakBehavioralAreas.slice(0, 5),
      uncoveredMetaValues: uncoveredMetaValues.slice(0, 5),
      avgPatternScore,
      avgBehavioralScore,
      mockSessionsCompleted: mockSessions,
    });
  };

  return (
    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-orange-500/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Rocket size={16} className="text-orange-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground">
              10-Day Final Sprint Generator
            </div>
            <div className="text-xs text-muted-foreground">
              AI reads your weak spots and builds a personalized day-by-day
              plan.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-medium">
            Final Stretch
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-orange-500/20">
          <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
            The AI reads your actual pattern ratings, behavioral coverage, and
            STAR story strength to build a plan targeting your specific weak
            spots — not a generic schedule.
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Days Until Interview
              </label>
              <input
                type="number"
                min={1}
                max={30}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                value={daysUntil}
                onChange={e =>
                  setDaysUntil(
                    Math.max(1, Math.min(30, parseInt(e.target.value) || 1))
                  )
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Target Level
              </label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                value={targetLevel}
                onChange={e => setTargetLevel(e.target.value)}
              >
                {["L4", "L5", "L6", "L7"].map(l => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Mocks Completed
              </label>
              <input
                type="number"
                min={0}
                max={50}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                value={mockSessions}
                onChange={e =>
                  setMockSessions(Math.max(0, parseInt(e.target.value) || 0))
                }
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {generateMutation.isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Rocket size={14} />
            )}
            {generateMutation.isPending
              ? "Building your plan..."
              : "Generate My Sprint Plan"}
          </button>

          {/* Sprint days */}
          {sprintDays && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Calendar size={13} />
                Your {sprintDays.length}-Day Personalized Sprint
              </div>
              {sprintDays.map((day, idx) => (
                <div
                  key={day.day}
                  className={`rounded-xl border p-4 ${DAY_COLORS[idx % DAY_COLORS.length]}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-background/50 text-xs font-bold flex items-center justify-center text-foreground">
                      {day.day}
                    </div>
                    <div className="font-semibold text-sm text-foreground">
                      {day.title}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Sun
                        size={13}
                        className="text-amber-400 mt-0.5 shrink-0"
                      />
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">
                          Morning
                        </div>
                        <div className="text-xs text-foreground">
                          {day.morningBlock}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Moon
                        size={13}
                        className="text-blue-400 mt-0.5 shrink-0"
                      />
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">
                          Afternoon
                        </div>
                        <div className="text-xs text-foreground">
                          {day.afternoonBlock}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Target size={12} className="text-emerald-400 shrink-0" />
                    <div className="text-xs text-emerald-300 font-medium">
                      {day.goal}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
