/**
 * Guided Learning Path — "Recommended Offer Path" 4-Phase Wizard
 *
 * Routes candidates from calibration → gap elimination → pressure simulation → final sprint
 * based on their actual prep data. Addresses the most common Meta rejection patterns.
 *
 * Design: Sticky top-of-page card. Collapses after user dismisses. Re-opens via button.
 */
import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  Circle,
  Target,
  Zap,
  Flame,
  Trophy,
  ArrowRight,
  X,
  RotateCcw,
} from "lucide-react";
import {
  usePatternRatings,
  useBehavioralRatings,
  useMockHistory,
  useStarNotes,
  useLocalStorage,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";

// ── Types ──────────────────────────────────────────────────────────────────
interface PathStep {
  id: string;
  label: string;
  detail: string;
  tab: string;
  anchor?: string;
  doneWhen: string; // human-readable completion condition
  isDone: boolean;
  priority: "critical" | "high" | "medium";
}

interface Phase {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  steps: PathStep[];
  exitCriteria: string;
}

// ── Hook: compute phase completion from real data ─────────────────────────
function usePathData() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [mockHistory] = useMockHistory();
  const [starNotes] = useStarNotes();

  return useMemo(() => {
    const totalPatterns = PATTERNS.length;
    const ratedPatterns = PATTERNS.filter(
      p => (patternRatings[p.id] ?? 0) > 0
    ).length;
    const masteredPatterns = PATTERNS.filter(
      p => (patternRatings[p.id] ?? 0) >= 3
    ).length;
    const weakPatterns = PATTERNS.filter(
      p => (patternRatings[p.id] ?? 0) > 0 && (patternRatings[p.id] ?? 0) <= 2
    ).length;

    const totalBQs = BEHAVIORAL_QUESTIONS.length;
    const ratedBQs = BEHAVIORAL_QUESTIONS.filter(
      q => (bqRatings[q.id] ?? 0) > 0
    ).length;
    const strongBQs = BEHAVIORAL_QUESTIONS.filter(
      q => (bqRatings[q.id] ?? 0) >= 3
    ).length;

    const bqAreas = Array.from(new Set(BEHAVIORAL_QUESTIONS.map(q => q.area)));
    const coveredAreas = bqAreas.filter(area =>
      BEHAVIORAL_QUESTIONS.filter(q => q.area === area).some(
        q => (bqRatings[q.id] ?? 0) >= 3
      )
    );

    const starNotesCount = Object.values(starNotes).filter(
      n => (n ?? "").trim().length > 30
    ).length;

    const mockCount = mockHistory.length;
    const avgMockScore =
      mockCount > 0
        ? mockHistory.reduce((s, m) => s + (m.avgScore ?? 0), 0) / mockCount
        : 0;

    const codingPct = Math.round((masteredPatterns / totalPatterns) * 100);
    const behavioralPct = Math.round((strongBQs / totalBQs) * 100);
    const overallPct = Math.round((codingPct + behavioralPct) / 2);

    return {
      totalPatterns,
      ratedPatterns,
      masteredPatterns,
      weakPatterns,
      totalBQs,
      ratedBQs,
      strongBQs,
      bqAreas,
      coveredAreas,
      starNotesCount,
      mockCount,
      avgMockScore,
      codingPct,
      behavioralPct,
      overallPct,
    };
  }, [patternRatings, bqRatings, mockHistory, starNotes]);
}

// ── Phase definitions ──────────────────────────────────────────────────────
function usePhases(
  onTabChange: (tab: string) => void,
  onScrollTo: (anchor: string) => void
): Phase[] {
  const d = usePathData();

  return [
    {
      id: 1,
      title: "Phase 1 — Calibrate",
      subtitle: "Weeks 1–2 · Know exactly where you stand",
      icon: <Target size={16} />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      exitCriteria:
        "All patterns rated · All BQs rated · Offer Probability baseline set",
      steps: [
        {
          id: "rate_patterns",
          label: "Rate all 15 coding patterns",
          detail:
            "Go to Drill Patterns tab → rate each pattern 1–5. Honest self-assessment only.",
          tab: "coding",
          doneWhen: `${d.ratedPatterns}/${d.totalPatterns} patterns rated`,
          isDone: d.ratedPatterns >= d.totalPatterns,
          priority: "critical",
        },
        {
          id: "rate_bqs",
          label: "Rate all 30 behavioral questions",
          detail:
            "Go to Tell Stories tab → rate each question. This reveals your real gaps.",
          tab: "behavioral",
          doneWhen: `${d.ratedBQs}/${d.totalBQs} BQs rated`,
          isDone: d.ratedBQs >= d.totalBQs,
          priority: "critical",
        },
        {
          id: "offer_probability",
          label: "Run the Offer Probability Dashboard",
          detail:
            "Scroll down to 'Offer Maximizer' → Offer Probability Dashboard. Get your baseline %.",
          tab: "overview",
          anchor: "offer-probability",
          doneWhen:
            d.overallPct > 0 ? `Baseline: ${d.overallPct}%` : "Not started",
          isDone: d.ratedPatterns > 0 && d.ratedBQs > 0,
          priority: "critical",
        },
        {
          id: "seniority_calibrator",
          label: "Run the Seniority Level Calibrator",
          detail:
            "Submit your best STAR story. Verify your answers signal the right IC level.",
          tab: "overview",
          anchor: "seniority-calibrator",
          doneWhen: "Submit 1 STAR story for level analysis",
          isDone: false,
          priority: "high",
        },
        {
          id: "warmup_habit",
          label: "Complete 2 Daily Warm-Up sessions",
          detail:
            "15 min/day: flashcards + complexity proofs + easy problem. Build the habit first.",
          tab: "overview",
          anchor: "daily-warmup",
          doneWhen: "2 warm-up sessions done",
          isDone: false,
          priority: "high",
        },
      ],
    },
    {
      id: 2,
      title: "Phase 2 — Fix Your Gaps",
      subtitle: "Weeks 3–5 · Eliminate the exact things that would reject you",
      icon: <Zap size={16} />,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      exitCriteria:
        "All patterns ≥ 3 · All BQ areas covered · STAR stories have numbers · Complexity proofs solid",
      steps: [
        {
          id: "fix_weak_patterns",
          label: `Drill your ${d.weakPatterns > 0 ? d.weakPatterns : "weak"} patterns to ≥ 3★`,
          detail:
            "Use Weak Pattern Remediation Plan. 5 problems per pattern, ordered by difficulty.",
          tab: "coding",
          doneWhen:
            d.weakPatterns === 0
              ? "✓ All patterns ≥ 3★"
              : `${d.weakPatterns} patterns still below 3★`,
          isDone: d.weakPatterns === 0 && d.ratedPatterns > 0,
          priority: "critical",
        },
        {
          id: "impact_quantification",
          label: "Add metrics to every STAR story",
          detail:
            "Use Impact Quantification Coach. Every story needs a specific number: %, ms, $, users.",
          tab: "behavioral",
          doneWhen:
            d.starNotesCount > 0
              ? `${d.starNotesCount} stories have notes`
              : "No stories written yet",
          isDone: d.starNotesCount >= 5,
          priority: "critical",
        },
        {
          id: "think_aloud",
          label: "Train thinking out loud (10 sessions)",
          detail:
            "Use Think Out Loud Coach. Silence during coding = instant reject. This is #1 killer.",
          tab: "coding",
          doneWhen: "10 narrated coding sessions",
          isDone: false,
          priority: "critical",
        },
        {
          id: "story_coverage",
          label: "Cover all Meta focus areas with stories",
          detail:
            "Use Story Coverage Matrix. You need a story for every Meta value, not just 2–3.",
          tab: "behavioral",
          doneWhen: `${d.coveredAreas.length}/${d.bqAreas.length} areas covered`,
          isDone:
            d.coveredAreas.length >= d.bqAreas.length && d.bqAreas.length > 0,
          priority: "high",
        },
        {
          id: "complexity_proof",
          label: "Prove complexity for your top 10 patterns",
          detail:
            "Use Complexity Proof Trainer. 20% of coding rejects can't derive their own complexity.",
          tab: "overview",
          anchor: "complexity-proof",
          doneWhen: "10 complexity proofs completed",
          isDone: false,
          priority: "high",
        },
        {
          id: "why_meta",
          label: "Build your genuine 'Why Meta' story",
          detail:
            "Use Why Meta Story Builder. Generic answers are a yellow flag. Be specific.",
          tab: "overview",
          anchor: "why-meta",
          doneWhen: "Why Meta narrative written",
          isDone: false,
          priority: "high",
        },
      ],
    },
    {
      id: 3,
      title: "Phase 3 — Simulate Pressure",
      subtitle: "Weeks 6–7 · Performance under pressure is a separate skill",
      icon: <Flame size={16} />,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      exitCriteria:
        "2+ full mock days · Average score ≥ 3.5/5 · No round exceeds allotted time",
      steps: [
        {
          id: "full_mock_days",
          label: "Complete 2 Full Mock Day simulations",
          detail:
            "Use Full Mock Day Simulator. A 5-hour loop is exhausting. Train the stamina.",
          tab: "overview",
          anchor: "full-mock-day",
          doneWhen:
            d.mockCount >= 2
              ? `✓ ${d.mockCount} mock days done`
              : `${d.mockCount}/2 mock days done`,
          isDone: d.mockCount >= 2,
          priority: "critical",
        },
        {
          id: "adversarial_followup",
          label: "Run 3 Adversarial Follow-Up sessions",
          detail:
            "Use Adversarial Follow-Up Simulator. Interviewers probe your weakest design point.",
          tab: "design",
          doneWhen: "3 adversarial sessions done",
          isDone: false,
          priority: "critical",
        },
        {
          id: "persona_stress",
          label: "Practice with 3 different interviewer personas",
          detail:
            "Use Interviewer Persona Stress Test. Skeptical/impatient interviewers derail 40%.",
          tab: "behavioral",
          doneWhen: "3 persona sessions done",
          isDone: false,
          priority: "high",
        },
        {
          id: "sd_mocks",
          label: "Complete 4 System Design mock sessions",
          detail:
            "Use System Design Mock. This is the highest-variance round. Reps matter most.",
          tab: "design",
          doneWhen: "4 SD mock sessions done",
          isDone: false,
          priority: "high",
        },
        {
          id: "avg_score",
          label: "Reach average mock score ≥ 3.5/5",
          detail:
            "Track in Mock History. Below 3.5 = not ready. Above 4.0 = strong signal.",
          tab: "overview",
          doneWhen:
            d.mockCount > 0
              ? `Current avg: ${d.avgMockScore.toFixed(1)}/5`
              : "No mocks yet",
          isDone: d.avgMockScore >= 3.5 && d.mockCount >= 2,
          priority: "high",
        },
      ],
    },
    {
      id: 4,
      title: "Phase 4 — Final Sprint",
      subtitle: "Week 8 · Don't lose a 90% prepared candidate to 10% failures",
      icon: <Trophy size={16} />,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      exitCriteria:
        "Question predictions reviewed · Debrief done · Day Before checklist complete",
      steps: [
        {
          id: "question_predictor",
          label: "Run Interview Question Predictor",
          detail:
            "Enter your team + level. Get the top 5 SD questions and top 3 behavioral areas.",
          tab: "overview",
          anchor: "question-predictor",
          doneWhen: "Predictions reviewed",
          isDone: false,
          priority: "critical",
        },
        {
          id: "ten_day_sprint",
          label: "Generate your 10-Day Final Sprint plan",
          detail:
            "Use 10-Day Sprint Generator. Personalized from your actual weak areas. Follow it exactly.",
          tab: "overview",
          anchor: "ten-day-sprint",
          doneWhen: "Sprint plan generated",
          isDone: false,
          priority: "critical",
        },
        {
          id: "post_debrief",
          label: "Run Post-Interview Debrief after each mock",
          detail:
            "Use Post-Interview Debrief Form. Most candidates stop improving 1 week before.",
          tab: "overview",
          anchor: "post-debrief",
          doneWhen: "1+ debrief completed",
          isDone: false,
          priority: "high",
        },
        {
          id: "day_before",
          label: "Complete the 'Day Before' Checklist",
          detail:
            "18 items: logistics, mental prep, content review. 5% of offers lost to logistics.",
          tab: "overview",
          anchor: "day-before",
          doneWhen: "All 18 items checked",
          isDone: false,
          priority: "critical",
        },
        {
          id: "warmup_day_of",
          label: "Do the Daily Warm-Up 1 hour before your interview",
          detail:
            "15 min: flashcards + 2 complexity proofs + 1 easy problem. Prime your brain.",
          tab: "overview",
          anchor: "daily-warmup",
          doneWhen: "Scheduled for interview morning",
          isDone: false,
          priority: "high",
        },
      ],
    },
  ];
}

// ── Main component ─────────────────────────────────────────────────────────
interface GuidedLearningPathProps {
  onTabChange: (tab: string) => void;
}

export function GuidedLearningPath({ onTabChange }: GuidedLearningPathProps) {
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(
    "meta_guided_path_collapsed_v1",
    false
  );
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const scrollToAnchor = (anchor: string) => {
    setTimeout(() => {
      const el = document.getElementById(anchor);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.boxShadow = "0 0 0 2px oklch(0.62 0.19 258 / 0.6)";
        setTimeout(() => (el.style.boxShadow = ""), 2000);
      }
    }, 150);
  };

  const phases = usePhases(onTabChange, scrollToAnchor);
  const d = usePathData();

  // Determine current phase
  const currentPhaseId = useMemo(() => {
    for (const phase of phases) {
      const allDone = phase.steps.every(s => s.isDone);
      if (!allDone) return phase.id;
    }
    return 4;
  }, [phases]);

  // Overall progress
  const totalSteps = phases.reduce((s, p) => s + p.steps.length, 0);
  const doneSteps = phases.reduce(
    (s, p) => s + p.steps.filter(st => st.isDone).length,
    0
  );
  const overallPct = Math.round((doneSteps / totalSteps) * 100);

  const PRIORITY_COLORS = {
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
    high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <Target size={15} className="text-blue-400" />
          <span className="text-sm font-semibold text-foreground">
            Guided Learning Path
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 font-medium">
            Phase {currentPhaseId} of 4
          </span>
          <span className="text-xs text-muted-foreground">
            {overallPct}% complete
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          <span>Expand</span>
          <ChevronDown size={14} />
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Target size={15} className="text-blue-400" />
          </div>
          <div>
            <div
              className="font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Guided Learning Path — Recommended Offer Path
            </div>
            <div className="text-xs text-muted-foreground">
              1 hour/day · 8 weeks · Addresses the most common Meta rejection
              patterns
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {doneSteps}/{totalSteps} steps · {overallPct}%
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Collapse"
          >
            <ChevronUp size={14} />
          </button>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="px-5 pt-3 pb-1">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              overallPct >= 80
                ? "bg-emerald-500"
                : overallPct >= 40
                  ? "bg-blue-500"
                  : "bg-amber-500"
            }`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Phase cards */}
      <div className="p-4 space-y-2">
        {phases.map(phase => {
          const phaseDone = phase.steps.every(s => s.isDone);
          const phasePct = Math.round(
            (phase.steps.filter(s => s.isDone).length / phase.steps.length) *
              100
          );
          const isActive = phase.id === currentPhaseId;
          const isExpanded = expandedPhase === phase.id;

          return (
            <div
              key={phase.id}
              className={`rounded-lg border transition-all ${
                phaseDone
                  ? "border-emerald-500/20 bg-emerald-500/5 opacity-70"
                  : isActive
                    ? `${phase.borderColor} ${phase.bgColor}`
                    : "border-border bg-secondary/20 opacity-50"
              }`}
            >
              {/* Phase header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      phaseDone
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isActive
                          ? `${phase.bgColor} ${phase.color}`
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {phaseDone ? <CheckCircle2 size={14} /> : phase.id}
                  </div>
                  <div className="text-left">
                    <div
                      className={`text-sm font-semibold ${phaseDone ? "text-emerald-400" : isActive ? phase.color : "text-muted-foreground"}`}
                    >
                      {phase.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {phase.subtitle}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isActive && !phaseDone && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${phase.bgColor} ${phase.color} ${phase.borderColor}`}
                    >
                      Active
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {phasePct}%
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={14} className="text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Phase steps */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-2">
                  {/* Exit criteria */}
                  <div className="text-xs text-muted-foreground mb-3 flex items-start gap-1.5">
                    <span className="text-blue-400 shrink-0 mt-0.5">✓</span>
                    <span>
                      <span className="font-semibold text-foreground">
                        Exit criteria:{" "}
                      </span>
                      {phase.exitCriteria}
                    </span>
                  </div>

                  {phase.steps.map(step => (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        step.isDone
                          ? "border-emerald-500/20 bg-emerald-500/5 opacity-60"
                          : "border-border bg-background/50 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {step.isDone ? (
                          <CheckCircle2
                            size={15}
                            className="text-emerald-400"
                          />
                        ) : (
                          <Circle
                            size={15}
                            className={
                              step.priority === "critical"
                                ? "text-red-400"
                                : step.priority === "high"
                                  ? "text-amber-400"
                                  : "text-muted-foreground"
                            }
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium ${step.isDone ? "line-through text-muted-foreground" : "text-foreground"}`}
                        >
                          {step.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {step.detail}
                        </div>
                        <div className="text-xs text-blue-400 mt-1 font-medium">
                          {step.doneWhen}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase ${PRIORITY_COLORS[step.priority]}`}
                        >
                          {step.priority}
                        </span>
                        {!step.isDone && (
                          <button
                            onClick={() => {
                              onTabChange(step.tab);
                              if (step.anchor) scrollToAnchor(step.anchor);
                            }}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
                          >
                            Go <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Auto-updates as you rate patterns, write stories, and complete mocks
        </div>
        <button
          onClick={() => setExpandedPhase(currentPhaseId)}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
        >
          <RotateCcw size={11} />
          Jump to Phase {currentPhaseId}
        </button>
      </div>
    </div>
  );
}
