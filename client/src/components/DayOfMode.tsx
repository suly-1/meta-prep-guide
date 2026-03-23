// Day-Of Preparation Suite
// Three components:
//   1. DayOfModePanel — D-0 2-hour morning routine (auto-activates when daysLeft === 0)
//   2. LastMileCheatSheet — 1-page PDF with top STAR stories, weakest patterns, SD template
//   3. ConfidenceCalibrationQuiz — 10-question rapid-fire self-assessment

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Timer,
  CheckCircle2,
  Circle,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Wind,
  BookOpen,
  Code2,
  Layout,
  Zap,
  Target,
  Trophy,
  AlertCircle,
} from "lucide-react";
import {
  PATTERNS,
  BEHAVIORAL_QUESTIONS,
  STAR_STORIES,
  SYSTEM_DESIGN_QUESTIONS,
} from "@/lib/data";
import { CTCI_QUESTIONS } from "@/lib/ctciData";
import {
  usePatternRatings,
  useBehavioralRatings,
  useStarNotes,
  useInterviewDate,
} from "@/hooks/useLocalStorage";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Breathing Timer ───────────────────────────────────────────────────────────
function BreathingTimer({ onDone }: { onDone: () => void }) {
  const PHASES = [
    {
      label: "Breathe In",
      duration: 4,
      color: "text-blue-400",
      ring: "oklch(0.62 0.19 240)",
    },
    {
      label: "Hold",
      duration: 4,
      color: "text-amber-400",
      ring: "oklch(0.78 0.17 75)",
    },
    {
      label: "Breathe Out",
      duration: 6,
      color: "text-emerald-400",
      ring: "oklch(0.65 0.18 145)",
    },
    {
      label: "Hold",
      duration: 2,
      color: "text-purple-400",
      ring: "oklch(0.65 0.22 290)",
    },
  ];
  const TOTAL_CYCLES = 4;
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase = PHASES[phaseIdx];
  const progress = tick / phase.duration;

  const start = () => {
    setRunning(true);
    setPhaseIdx(0);
    setTick(0);
    setCycle(1);
    setDone(false);
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTick(t => {
        const next = t + 1;
        if (next >= PHASES[phaseIdx].duration) {
          // Advance phase
          const nextPhase = (phaseIdx + 1) % PHASES.length;
          setPhaseIdx(nextPhase);
          if (nextPhase === 0) {
            // Completed a full cycle
            setCycle(c => {
              if (c >= TOTAL_CYCLES) {
                clearInterval(intervalRef.current!);
                setRunning(false);
                setDone(true);
                return c;
              }
              return c + 1;
            });
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running, phaseIdx]);

  const circumference = 2 * Math.PI * 44;
  const strokeDash = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="oklch(0.22 0.02 264)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={phase.ring}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Wind size={16} className={phase.color} />
          <span className="text-2xl font-black text-foreground">
            {phase.duration - tick}
          </span>
        </div>
      </div>
      <div className={`text-sm font-bold ${phase.color}`}>
        {running ? phase.label : done ? "Complete!" : "4-4-6-2 Box Breathing"}
      </div>
      {running && (
        <div className="text-xs text-muted-foreground">
          Cycle {cycle} of {TOTAL_CYCLES}
        </div>
      )}
      {!running && !done && (
        <button
          onClick={start}
          className="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all"
        >
          Start 4 Cycles (~1 min)
        </button>
      )}
      {done && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-emerald-400 font-semibold">
            ✓ Breathing complete — you're calm and focused
          </div>
          <button
            onClick={onDone}
            className="px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
          >
            Mark Complete ✓
          </button>
        </div>
      )}
    </div>
  );
}

// ── D-0 Morning Routine ───────────────────────────────────────────────────────
const MORNING_PHASES = [
  {
    id: "warmup",
    icon: Code2,
    label: "Warm-Up Problem",
    duration: "20 min",
    color: "blue",
    description:
      "Solve 1 Easy Meta-frequency LeetCode problem. Focus on clean code and talking through your approach — not speed.",
  },
  {
    id: "star",
    icon: BookOpen,
    label: "STAR Story Review",
    duration: "30 min",
    color: "amber",
    description:
      "Review your top 3 STAR stories out loud. Time yourself: each story should be 90–120 seconds. Focus on the Result — quantify impact.",
  },
  {
    id: "design",
    icon: Layout,
    label: "System Design Recap",
    duration: "20 min",
    color: "purple",
    description:
      "Skim your system design template: Requirements → Estimation → High-Level → Deep Dive → Trade-offs. Pick 1 design question and sketch the architecture mentally.",
  },
  {
    id: "breathing",
    icon: Wind,
    label: "Calm Down & Focus",
    duration: "10 min",
    color: "emerald",
    description:
      "4-4-6-2 box breathing (4 cycles). Then visualise walking into the interview confident and prepared. No more studying.",
  },
];

export function DayOfModePanel() {
  const [interviewDate] = useInterviewDate();
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [starNotes] = useStarNotes();
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("meta_dayof_completed_v1") ?? "{}"
      );
    } catch {
      return {};
    }
  });
  const [expanded, setExpanded] = useState<string | null>("warmup");
  const [breathingDone, setBreathingDone] = useState(false);

  const saveCompleted = (next: Record<string, boolean>) => {
    setCompleted(next);
    localStorage.setItem("meta_dayof_completed_v1", JSON.stringify(next));
  };

  const toggle = (id: string) => {
    const next = { ...completed, [id]: !completed[id] };
    saveCompleted(next);
    if (!completed[id])
      toast.success(
        `✓ ${MORNING_PHASES.find(p => p.id === id)?.label} complete!`
      );
  };

  const daysLeft = interviewDate ? getDaysUntil(interviewDate) : null;
  const isInterviewDay = daysLeft === 0;

  // Pick a warm-up problem: Easy, High Meta frequency
  const warmupProblem =
    CTCI_QUESTIONS.find(
      q => q.difficulty === "Easy" && q.metaFreq === "High"
    ) ?? CTCI_QUESTIONS[0];

  // Top 3 STAR stories with notes
  const topStories = STAR_STORIES.slice(0, 3).map(s => ({
    ...s,
    note: starNotes[s.id] ?? "",
  }));

  // Weakest patterns for design recap
  const weakPatterns = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) > 0 && (patternRatings[p.id] ?? 0) <= 2
  ).slice(0, 3);

  const completedCount = MORNING_PHASES.filter(p => completed[p.id]).length;
  const allDone = completedCount === MORNING_PHASES.length;

  if (!isInterviewDay) {
    return (
      <div className="prep-card p-5 border-2 border-dashed border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <Zap size={16} className="text-amber-400" />
          <div className="text-sm font-bold text-foreground">
            D-0 Interview Day Mode
          </div>
          <span className="badge badge-gray text-[10px]">
            Activates on interview day
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {daysLeft !== null && daysLeft > 0
            ? `This panel will activate in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} with your structured 2-hour morning routine.`
            : "Set your interview date in the countdown widget to activate this panel on interview day."}
        </div>
      </div>
    );
  }

  return (
    <div className="prep-card p-5 border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/30 to-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber-400 animate-pulse" />
          <span className="text-sm font-black text-amber-400">
            🎯 TODAY IS THE DAY — D-0 Mode Active
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {completedCount}/{MORNING_PHASES.length} phases
        </div>
      </div>

      {allDone && (
        <div className="mb-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 font-semibold text-center">
          🏆 Morning routine complete! You are ready. Go crush it.
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-4 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
          style={{
            width: `${(completedCount / MORNING_PHASES.length) * 100}%`,
          }}
        />
      </div>

      {/* Phase cards */}
      <div className="space-y-3">
        {MORNING_PHASES.map((phase, i) => {
          const Icon = phase.icon;
          const isExpanded = expanded === phase.id;
          const isDone = completed[phase.id];
          const colorMap: Record<string, string> = {
            blue: "border-blue-500/30 bg-blue-500/5",
            amber: "border-amber-500/30 bg-amber-500/5",
            purple: "border-purple-500/30 bg-purple-500/5",
            emerald: "border-emerald-500/30 bg-emerald-500/5",
          };
          const textMap: Record<string, string> = {
            blue: "text-blue-400",
            amber: "text-amber-400",
            purple: "text-purple-400",
            emerald: "text-emerald-400",
          };

          return (
            <div
              key={phase.id}
              className={`rounded-lg border transition-all ${isDone ? "border-emerald-500/20 bg-emerald-500/5 opacity-70" : colorMap[phase.color]}`}
            >
              <button
                className="w-full flex items-center gap-3 p-3 text-left"
                onClick={() => setExpanded(isExpanded ? null : phase.id)}
              >
                <span className="shrink-0 text-xs font-black text-muted-foreground w-4">
                  {i + 1}
                </span>
                {isDone ? (
                  <CheckCircle2
                    size={15}
                    className="text-emerald-400 shrink-0"
                  />
                ) : (
                  <Icon
                    size={15}
                    className={`${textMap[phase.color]} shrink-0`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-bold ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {phase.label}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold ${textMap[phase.color]} shrink-0`}
                >
                  {phase.duration}
                </span>
                {isExpanded ? (
                  <ChevronUp
                    size={12}
                    className="text-muted-foreground shrink-0"
                  />
                ) : (
                  <ChevronDown
                    size={12}
                    className="text-muted-foreground shrink-0"
                  />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {phase.description}
                  </p>

                  {/* Warm-up: show the problem */}
                  {phase.id === "warmup" && (
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                      <div className="text-xs font-semibold text-foreground mb-1">
                        Today's Warm-Up Problem
                      </div>
                      <a
                        href={warmupProblem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline font-mono"
                      >
                        #{warmupProblem.num} {warmupProblem.name}
                      </a>
                      <div className="flex gap-2 mt-1">
                        <span className="badge badge-green text-[9px]">
                          {warmupProblem.difficulty}
                        </span>
                        <span className="badge badge-blue text-[9px]">
                          Meta High Freq
                        </span>
                        {warmupProblem.topics.slice(0, 2).map(t => (
                          <span key={t} className="badge badge-gray text-[9px]">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-[10px] text-muted-foreground">
                        💡 Tip: Say your approach out loud before coding. Aim
                        for clean, readable code — not the fastest solution.
                      </div>
                    </div>
                  )}

                  {/* STAR: show top 3 stories */}
                  {phase.id === "star" && (
                    <div className="space-y-2">
                      {topStories.map((story, idx) => (
                        <div
                          key={story.id}
                          className="p-3 rounded-lg bg-secondary/50 border border-border"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-amber-400">
                              Story {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              {story.title}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground whitespace-pre-line">
                            {story.note || story.template}
                          </div>
                          <div className="mt-1 text-[10px] text-amber-300/70">
                            🎯 Tags: {story.tags.join(", ")}
                          </div>
                        </div>
                      ))}
                      <div className="text-[10px] text-muted-foreground mt-1">
                        💡 Tip: Each story should be 90–120 seconds. Quantify
                        the Result. Practice out loud.
                      </div>
                    </div>
                  )}

                  {/* Design: show SD template + weak patterns */}
                  {phase.id === "design" && (
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                        <div className="text-xs font-semibold text-foreground mb-2">
                          System Design Template
                        </div>
                        {[
                          [
                            "1. Requirements (5 min)",
                            "Functional + Non-functional. Clarify scale, SLAs, constraints.",
                          ],
                          [
                            "2. Estimation (3 min)",
                            "QPS, storage, bandwidth. Back-of-envelope only.",
                          ],
                          [
                            "3. High-Level Design (10 min)",
                            "Core components: clients, load balancer, services, DB, cache.",
                          ],
                          [
                            "4. Deep Dive (15 min)",
                            "Pick 2-3 components to go deep. Show trade-offs.",
                          ],
                          [
                            "5. Trade-offs & Wrap-up (5 min)",
                            "CAP theorem, consistency vs availability, future improvements.",
                          ],
                        ].map(([step, desc]) => (
                          <div key={step} className="mb-2">
                            <div className="text-[10px] font-bold text-purple-400">
                              {step}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {desc}
                            </div>
                          </div>
                        ))}
                      </div>
                      {weakPatterns.length > 0 && (
                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                          <div className="text-xs font-semibold text-red-400 mb-1">
                            ⚠️ Your Weak Patterns — Quick Refresh
                          </div>
                          {weakPatterns.map(p => (
                            <div
                              key={p.id}
                              className="text-[10px] text-muted-foreground mb-1"
                            >
                              <span className="font-semibold text-foreground">
                                {p.name}:
                              </span>{" "}
                              {p.keyIdea}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Breathing: interactive timer */}
                  {phase.id === "breathing" && (
                    <BreathingTimer onDone={() => toggle("breathing")} />
                  )}

                  {/* Mark complete button (except breathing which has its own) */}
                  {phase.id !== "breathing" && (
                    <button
                      onClick={() => toggle(phase.id)}
                      className={`w-full py-2 rounded-lg border text-xs font-semibold transition-all ${
                        isDone
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : `border-${phase.color}-500/30 bg-${phase.color}-500/10 text-${phase.color}-400 hover:bg-${phase.color}-500/20`
                      }`}
                    >
                      {isDone ? "✓ Completed" : "Mark as Complete"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Last-Mile Cheat Sheet Generator ──────────────────────────────────────────
export function LastMileCheatSheet() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [starNotes] = useStarNotes();
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const W = 210;
      const MARGIN = 12;
      let y = 0;

      // ── Header ──
      doc.setFillColor(10, 15, 30);
      doc.rect(0, 0, W, 22, "F");
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 4, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Meta Interview — Last-Mile Cheat Sheet", MARGIN, 10);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated: ${new Date().toLocaleString()} · Review 30 min before your interview`,
        MARGIN,
        17
      );
      y = 28;

      const sectionHeader = (
        title: string,
        color: [number, number, number]
      ) => {
        doc.setFillColor(...color);
        doc.rect(MARGIN, y, W - MARGIN * 2, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(title, MARGIN + 2, y + 5);
        y += 10;
      };

      const bodyLine = (
        text: string,
        indent = 0,
        textColor: [number, number, number] = [203, 213, 225]
      ) => {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
        doc.setTextColor(...textColor);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(text, W - MARGIN * 2 - indent - 4);
        doc.text(lines, MARGIN + indent, y);
        y += lines.length * 5 + 1;
      };

      // ── Section 1: Top 3 STAR Stories ──
      sectionHeader("★ TOP 3 STAR STORIES", [30, 58, 138]);
      const topStories = STAR_STORIES.slice(0, 3);
      topStories.forEach((story, i) => {
        const note = starNotes[story.id] ?? story.template;
        bodyLine(`${i + 1}. ${story.title}`, 0, [255, 255, 255]);
        bodyLine(`   Tags: ${story.tags.join(", ")}`, 0, [100, 116, 139]);
        const noteLines = note.split("\n").slice(0, 4);
        noteLines.forEach(line => bodyLine(`   ${line}`, 0, [148, 163, 184]));
        y += 2;
      });
      y += 3;

      // ── Section 2: 5 Weakest Patterns ──
      sectionHeader("⚠ 5 WEAKEST PATTERNS — QUICK REFRESH", [127, 29, 29]);
      const weakPatterns = PATTERNS.filter(p => (patternRatings[p.id] ?? 0) > 0)
        .sort(
          (a, b) => (patternRatings[a.id] ?? 0) - (patternRatings[b.id] ?? 0)
        )
        .slice(0, 5);
      const unratedPatterns = PATTERNS.filter(
        p => !(patternRatings[p.id] ?? 0)
      );
      const patternsToShow =
        weakPatterns.length >= 3
          ? weakPatterns
          : [...weakPatterns, ...unratedPatterns].slice(0, 5);

      patternsToShow.forEach((p, i) => {
        const rating = patternRatings[p.id] ?? 0;
        bodyLine(
          `${i + 1}. ${p.name} [${p.diff}] ${rating > 0 ? `★${rating}` : "unrated"}`,
          0,
          [252, 165, 165]
        );
        bodyLine(`   ${p.keyIdea}`, 0, [148, 163, 184]);
        bodyLine(
          `   Examples: ${p.examples.slice(0, 2).join(", ")}`,
          0,
          [100, 116, 139]
        );
        y += 1;
      });
      y += 3;

      // ── Section 3: System Design Template ──
      sectionHeader("🏗 SYSTEM DESIGN TEMPLATE (38 min)", [88, 28, 135]);
      const sdSteps = [
        [
          "Requirements (5 min)",
          "Functional + Non-functional. Clarify scale, SLAs, constraints. Ask: DAU, read/write ratio, latency SLA.",
        ],
        [
          "Estimation (3 min)",
          "QPS = DAU × actions/day ÷ 86400. Storage = QPS × object_size × retention. Back-of-envelope only.",
        ],
        [
          "High-Level Design (10 min)",
          "Draw: Client → LB → App Servers → DB + Cache + CDN. Label data flows.",
        ],
        [
          "Deep Dive (15 min)",
          "Pick 2-3 hotspots. Show trade-offs: SQL vs NoSQL, push vs pull, sync vs async.",
        ],
        [
          "Trade-offs & Wrap-up (5 min)",
          "CAP theorem stance. Failure modes. What you'd do with more time.",
        ],
      ];
      sdSteps.forEach(([step, desc]) => {
        bodyLine(step, 0, [216, 180, 254]);
        bodyLine(desc, 4, [148, 163, 184]);
        y += 1;
      });
      y += 3;

      // ── Footer ──
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(
          "Engineering Interview Prep · Independent community resource, not affiliated with any company.",
          MARGIN,
          290
        );
      }

      doc.save("meta_last_mile_cheat_sheet.pdf");
      toast.success("Last-Mile Cheat Sheet downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("PDF generation failed — please try again");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="section-title mb-0 pb-0 border-0">
          Last-Mile Cheat Sheet
        </div>
        <span className="badge badge-amber text-[10px]">1-Page PDF</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        One click generates a personalized 1-page PDF: your top 3 STAR stories,
        the 5 patterns you rated lowest, and your system design template —
        formatted for a quick scan 30 minutes before the interview.
      </p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {
            icon: BookOpen,
            label: "Top 3 STAR Stories",
            color: "text-blue-400",
          },
          {
            icon: AlertCircle,
            label: "5 Weakest Patterns",
            color: "text-red-400",
          },
          { icon: Layout, label: "SD Template", color: "text-purple-400" },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="p-3 rounded-lg bg-secondary/50 border border-border text-center"
          >
            <Icon size={14} className={`${color} mx-auto mb-1`} />
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <button
        onClick={generate}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-all disabled:opacity-50"
      >
        <Download size={14} />
        {generating
          ? "Generating PDF…"
          : "Generate Last-Mile Cheat Sheet (.pdf)"}
      </button>
    </div>
  );
}

// ── Confidence Calibration Quiz ───────────────────────────────────────────────
const CALIBRATION_QUESTIONS = [
  {
    id: "q1",
    area: "Coding",
    text: "How confident are you in solving a Medium-difficulty array/string problem in 35 minutes?",
  },
  {
    id: "q2",
    area: "Coding",
    text: "How confident are you in explaining your time and space complexity clearly?",
  },
  {
    id: "q3",
    area: "Coding",
    text: "How confident are you in handling follow-up questions about edge cases and optimizations?",
  },
  {
    id: "q4",
    area: "System Design",
    text: "How confident are you in structuring a 38-minute system design answer (requirements → deep dive → trade-offs)?",
  },
  {
    id: "q5",
    area: "System Design",
    text: "How confident are you in estimating QPS, storage, and bandwidth on the fly?",
  },
  {
    id: "q6",
    area: "Behavioral",
    text: "How confident are you in delivering a crisp 90-second STAR story with a quantified result?",
  },
  {
    id: "q7",
    area: "Behavioral",
    text: "How confident are you in demonstrating L6/L7-level scope and impact in your stories?",
  },
  {
    id: "q8",
    area: "Communication",
    text: "How confident are you in thinking out loud and narrating your problem-solving process?",
  },
  {
    id: "q9",
    area: "Communication",
    text: "How confident are you in asking good clarifying questions before diving in?",
  },
  {
    id: "q10",
    area: "Mindset",
    text: "How confident are you in staying calm and recovering if you get stuck?",
  },
];

const CONFIDENCE_LABELS = [
  "Not at all",
  "Slightly",
  "Somewhat",
  "Confident",
  "Very confident",
];

export function ConfidenceCalibrationQuiz() {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const q = CALIBRATION_QUESTIONS[currentIdx];
  const totalAnswered = Object.keys(answers).length;

  const handleSelect = (val: number) => setSelected(val);

  const handleNext = () => {
    if (selected === null) return;
    const next = { ...answers, [q.id]: selected };
    setAnswers(next);
    setSelected(null);
    if (currentIdx + 1 >= CALIBRATION_QUESTIONS.length) {
      setDone(true);
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  const reset = () => {
    setStarted(false);
    setAnswers({});
    setCurrentIdx(0);
    setDone(false);
    setSelected(null);
  };

  // Compute results
  const computeResults = () => {
    const byArea: Record<string, number[]> = {};
    CALIBRATION_QUESTIONS.forEach(q => {
      const score = answers[q.id] ?? 0;
      if (!byArea[q.area]) byArea[q.area] = [];
      byArea[q.area].push(score);
    });
    const areaScores = Object.entries(byArea).map(([area, scores]) => ({
      area,
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));
    const overallAvg =
      Object.values(answers).reduce((a, b) => a + b, 0) /
      CALIBRATION_QUESTIONS.length;
    const overallPct = Math.round((overallAvg / 4) * 100);
    const weakAreas = areaScores.sort((a, b) => a.avg - b.avg).slice(0, 2);
    return { areaScores, overallPct, weakAreas };
  };

  if (!started) {
    return (
      <div className="prep-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="section-title mb-0 pb-0 border-0">
            Confidence Calibration Quiz
          </div>
          <span className="badge badge-blue text-[10px]">
            10 Questions · ~2 min
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          A rapid-fire self-assessment across Coding, System Design, Behavioral,
          Communication, and Mindset. Produces a final readiness score and a
          "Focus on these 2 things in the next hour" recommendation.
        </p>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            "Coding",
            "System Design",
            "Behavioral",
            "Communication",
            "Mindset",
          ].map(area => (
            <div
              key={area}
              className="p-2 rounded-lg bg-secondary/50 border border-border text-center"
            >
              <div className="text-[10px] text-muted-foreground">{area}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setStarted(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-sm font-semibold text-blue-400 transition-all"
        >
          <Target size={14} />
          Start Calibration Quiz
        </button>
      </div>
    );
  }

  if (done) {
    const { areaScores, overallPct, weakAreas } = computeResults();
    const readinessLabel =
      overallPct >= 80
        ? "High Confidence"
        : overallPct >= 60
          ? "Moderate Confidence"
          : "Needs Focus";
    const readinessColor =
      overallPct >= 80
        ? "text-emerald-400"
        : overallPct >= 60
          ? "text-amber-400"
          : "text-red-400";

    const focusRecs: Record<string, string> = {
      Coding:
        "Do 1 easy warm-up problem and review your top 2 patterns' key ideas.",
      "System Design":
        "Skim your SD template once more and mentally sketch a News Feed design.",
      Behavioral:
        "Rehearse your top STAR story out loud — time yourself at 90 seconds.",
      Communication:
        "Practice narrating your thought process on a simple problem for 5 minutes.",
      Mindset:
        "Do 4 cycles of box breathing and remind yourself: you've done the work.",
    };

    return (
      <div className="prep-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="section-title mb-0 pb-0 border-0">
            Calibration Results
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={11} /> Retake
          </button>
        </div>

        {/* Overall score */}
        <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="text-center">
            <div className={`text-3xl font-black ${readinessColor}`}>
              {overallPct}%
            </div>
            <div className={`text-[10px] font-bold ${readinessColor}`}>
              {readinessLabel}
            </div>
          </div>
          <div className="flex-1">
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${overallPct}%`,
                  background:
                    overallPct >= 80
                      ? "oklch(0.65 0.18 145)"
                      : overallPct >= 60
                        ? "oklch(0.78 0.17 75)"
                        : "oklch(0.65 0.22 25)",
                }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {overallPct >= 80
                ? "You're in great shape. Trust your preparation."
                : overallPct >= 60
                  ? "Solid foundation. Focus on the 2 areas below."
                  : "Some gaps remain. Prioritise the recommendations below."}
            </div>
          </div>
        </div>

        {/* Area breakdown */}
        <div className="space-y-2 mb-5">
          {areaScores.map(({ area, avg }) => {
            const pct = Math.round((avg / 4) * 100);
            return (
              <div key={area} className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground w-28 shrink-0">
                  {area}
                </div>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background:
                        pct >= 75
                          ? "oklch(0.65 0.18 145)"
                          : pct >= 50
                            ? "oklch(0.78 0.17 75)"
                            : "oklch(0.65 0.22 25)",
                    }}
                  />
                </div>
                <div className="text-xs font-bold text-foreground w-8 text-right">
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Focus recommendations */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={13} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400">
              Focus on these 2 things in the next hour:
            </span>
          </div>
          {weakAreas.map(({ area }, i) => (
            <div key={area} className="flex items-start gap-2 mb-2">
              <span className="text-amber-400 font-black text-xs shrink-0">
                {i + 1}.
              </span>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  {area}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {focusRecs[area]}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-[10px] text-muted-foreground text-center">
          Remember: confidence comes from preparation, and you've done the work.
          💪
        </div>
      </div>
    );
  }

  // Quiz in progress
  const progress = (currentIdx / CALIBRATION_QUESTIONS.length) * 100;

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="section-title mb-0 pb-0 border-0">
          Confidence Calibration
        </div>
        <span className="text-xs text-muted-foreground">
          {currentIdx + 1} / {CALIBRATION_QUESTIONS.length}
        </span>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-5">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="mb-2">
        <span className="badge badge-blue text-[10px] mb-2">{q.area}</span>
        <p className="text-sm font-semibold text-foreground leading-relaxed">
          {q.text}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2 mt-4 mb-5">
        {CONFIDENCE_LABELS.map((label, val) => (
          <button
            key={val}
            onClick={() => handleSelect(val)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
              selected === val
                ? "border-blue-500/60 bg-blue-500/15 text-blue-300"
                : "border-border bg-secondary/30 text-muted-foreground hover:border-blue-500/30 hover:text-foreground"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                selected === val
                  ? "border-blue-400 bg-blue-400"
                  : "border-muted-foreground"
              }`}
            >
              {selected === val && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={selected === null}
        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {currentIdx + 1 === CALIBRATION_QUESTIONS.length
          ? "See Results"
          : "Next →"}
      </button>
    </div>
  );
}
