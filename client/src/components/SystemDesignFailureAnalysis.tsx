/**
 * SystemDesignFailureAnalysis
 * Evidence-backed section showing why candidates fail system design interviews,
 * with data, statistics, and actionable guidance for Meta L6/L7 candidates.
 *
 * Sources:
 * - IGotAnOffer (Apr 2025): Meta interview pass rates
 * - Exponent (Mar 2026): Meta System Design Interview Guide
 * - Beyz AI (Feb 2026): System Design Interview Rubric
 * - Medium / Let's Code Future (Feb 2026): 12 failed interviews case study
 * - DesignGurus (2024): Meta success rate data
 * - Reddit/Blind community data (2024-2025)
 */

import { useState } from "react";
import {
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Target,
  Clock,
  Layers,
  Zap,
  Shield,
  MessageSquare,
  GitBranch,
  ClipboardCheck,
  Bot,
  ArrowRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ─── Data ────────────────────────────────────────────────────────────────────

const PASS_RATE_FUNNEL = [
  {
    stage: "Resume / Application",
    rate: "~10%",
    color: "bg-blue-500",
    note: "~90% filtered at resume stage",
  },
  {
    stage: "Recruiter Screen",
    rate: "~75%",
    color: "bg-blue-400",
    note: "Of those who reach this stage",
  },
  {
    stage: "Technical Screen",
    rate: "~25%",
    color: "bg-amber-500",
    note: "Coding + System Design gate",
  },
  {
    stage: "Full Onsite Loop",
    rate: "~5%",
    color: "bg-red-500",
    note: "Of all applicants who reach onsite",
  },
];

const FAILURE_REASONS = [
  {
    rank: 1,
    title: "Skipping Requirements Clarification",
    frequency: "Most Common",
    frequencyColor: "text-red-400",
    icon: MessageSquare,
    description:
      "Jumping straight into architecture without asking about scale, constraints, or use cases. Leads to designing the wrong system entirely.",
    metaFeedback:
      '"You assumed traffic numbers." — Real Meta interviewer feedback',
    fix: "Spend the first 5–10 minutes asking: What is the scale? What is the acceptable latency? What can we trade off? Never assume — always ask.",
    ic7Signal:
      "L7 candidates define success metrics (e.g., p99 < 200ms, 99.95% uptime) before drawing a single box.",
  },
  {
    rank: 2,
    title: "No Trade-off Articulation",
    frequency: "Very Common",
    frequencyColor: "text-red-400",
    icon: GitBranch,
    description:
      "Picking technologies without explaining why. Saying 'use Kafka' without defining ordering semantics or explaining the trade-off.",
    metaFeedback:
      '"Interviewers care less about your specific choices and more about whether you can identify trade-offs." — Exponent 2026',
    fix: "For every major decision say: 'I'm choosing X because it trades A for B, and B matters more under these constraints.'",
    ic7Signal:
      "L7 makes trade-offs measurable: 'I'll accept up to 5 seconds of staleness to reduce write latency by 80%.'",
  },
  {
    rank: 3,
    title: "Designing Without Addressing Scale",
    frequency: "Very Common",
    frequencyColor: "text-red-400",
    icon: BarChart2,
    description:
      "Presenting a system that works for 1,000 users with no clear path to billions. At Meta, scale is a baseline expectation, not a follow-up.",
    metaFeedback:
      '"Generic add more servers answers don\'t cut it." — Exponent 2026',
    fix: "Always address: sharding strategy, caching layers (L1/L2), CDN placement, event-driven fanout for write-heavy systems.",
    ic7Signal:
      "L7 names the first bottleneck proactively: 'At 500M DAU the fanout queue becomes the bottleneck — here's how I'd mitigate it.'",
  },
  {
    rank: 4,
    title: "Poor Time Management",
    frequency: "Common",
    frequencyColor: "text-amber-400",
    icon: Clock,
    description:
      "Spending 25+ minutes on high-level architecture and leaving no time for deep dives, trade-offs, or edge cases.",
    metaFeedback:
      '"The last 10–15 minutes are where strong candidates differentiate themselves." — Exponent 2026',
    fix: "Use the 5-10-25-10 split: 5 min requirements, 10 min baseline, 25 min deep dive + trade-offs, 10 min failure modes + Q&A.",
    ic7Signal:
      "L7 candidates manage the clock visibly: 'I want to spend the next 10 minutes on the data model, then move to scale.'",
  },
  {
    rank: 5,
    title: "Optimizing Without Knowing the Bottleneck",
    frequency: "Common",
    frequencyColor: "text-amber-400",
    icon: Target,
    description:
      "Adding Kafka, microservices, and event sourcing before identifying what actually needs to be optimized.",
    metaFeedback:
      '"Your bottleneck analysis was weak." — Real Stripe interviewer feedback',
    fix: "Before adding any optimization, state: 'The first bottleneck at this scale is X. Here's how I'd measure it and what I'd do.'",
    ic7Signal:
      "L7 uses back-of-envelope math to justify: '10M DAU × 10 writes/day = ~1,160 writes/sec — within a single DB, no sharding needed yet.'",
  },
  {
    rank: 6,
    title: "Ignoring Failure Modes",
    frequency: "Common",
    frequencyColor: "text-amber-400",
    icon: Shield,
    description:
      "Designing the happy path only. No discussion of what happens when a dependency is slow, a node fails, or traffic spikes 10x.",
    metaFeedback:
      '"Ignores overload/cascades/metrics" = weak signal on the Beyz AI rubric used by Meta interviewers',
    fix: "For every critical dependency, add: 'If this slows down, we need a timeout + circuit breaker + degraded path.'",
    ic7Signal:
      "L7 proactively names what to monitor: 'I'd alert on p99 latency > 500ms, queue depth > 10K, and error rate > 0.1%.'",
  },
  {
    rank: 7,
    title: "Microservices Soup (Over-engineering)",
    frequency: "Moderately Common",
    frequencyColor: "text-amber-400",
    icon: Layers,
    description:
      "Jumping to complex distributed architecture without justification. 15 microservices for a system that could start as a monolith.",
    metaFeedback:
      '"Microservices soup" is a named anti-pattern in Meta\'s internal rubric',
    fix: "Start with the simplest baseline that satisfies the constraints. Add complexity only when you can justify it with a specific constraint.",
    ic7Signal:
      "L7 explicitly says: 'I'll start monolithic and extract services only when X constraint forces it — here's the trigger.'",
  },
  {
    rank: 8,
    title: "No Data Model Tied to Access Patterns",
    frequency: "Moderately Common",
    frequencyColor: "text-amber-400",
    icon: Zap,
    description:
      "Picking a database 'because it's fast' without tying the schema or keys to actual read/write patterns.",
    metaFeedback: '"Picks a DB because X" = weak signal on the Beyz AI rubric',
    fix: "Always say: 'The storage choice follows the access pattern. We read by X and write by Y, so the schema should be...'",
    ic7Signal:
      "L7 designs the data model first, then picks the storage: 'Given 90% reads by user_id, a key-value store with user_id as partition key is optimal.'",
  },
];

const RUBRIC_AXES = [
  {
    axis: "Scope & Success Metrics",
    strong: "Lock constraints + non-goals before drawing",
    weak: "Starts designing with no targets",
    weight: "High",
  },
  {
    axis: "Request Flow & Hot Path",
    strong: "Trace one request end-to-end",
    weak: "Boxes with no traffic story",
    weight: "High",
  },
  {
    axis: "Data Model & Storage",
    strong: "Tie schema/keys to access patterns",
    weak: "Picks a DB 'because X'",
    weight: "High",
  },
  {
    axis: "Architecture & Boundaries",
    strong: "Simple baseline, clear ownership",
    weak: "Microservices soup",
    weight: "Medium",
  },
  {
    axis: "Scale & Bottlenecks",
    strong: "Name what breaks first + mitigation",
    weak: "'We'll just scale it'",
    weight: "High",
  },
  {
    axis: "Reliability & Operability",
    strong: "Failure mode → degrade path → what to monitor",
    weak: "Ignores overload/cascades/metrics",
    weight: "High",
  },
  {
    axis: "Trade-offs & Judgment",
    strong: "Make trade-offs explicit + measurable",
    weak: "Avoids choosing or hand-waves",
    weight: "Very High",
  },
  {
    axis: "Collaboration & Communication",
    strong: "Check alignment, adapt to hints",
    weak: "Talks at the interviewer",
    weight: "High",
  },
];

const L6_VS_L7 = [
  {
    dimension: "Scale Handling",
    ic6: "Addresses scale when prompted; knows the right patterns",
    ic7: "Proactively identifies the first bottleneck and quantifies it before being asked",
  },
  {
    dimension: "Trade-offs",
    ic6: "Can articulate trade-offs when asked",
    ic7: "Makes trade-offs measurable: 'I'll accept X ms of staleness to reduce write latency by Y%'",
  },
  {
    dimension: "Failure Modes",
    ic6: "Mentions failure handling when prompted",
    ic7: "Proactively defines failure modes, degrade paths, and production monitoring signals",
  },
  {
    dimension: "Data Model",
    ic6: "Designs a correct schema",
    ic7: "Derives the schema from access patterns and explains the partition key choice",
  },
  {
    dimension: "Time Management",
    ic6: "Covers most areas within 45 minutes",
    ic7: "Explicitly manages the clock: 'I want to spend 10 min on X, then move to Y'",
  },
  {
    dimension: "Baseline First",
    ic6: "May jump to complex architecture",
    ic7: "Always starts with the simplest baseline, adds complexity with explicit justification",
  },
];

const FRAMEWORK_PHASES = [
  {
    phase: "Phase 1",
    title: "Understand the Problem",
    time: "5–10 min",
    color: "border-blue-500 bg-blue-500/10",
    steps: [
      "Scale: DAU, QPS, data volume, growth rate",
      "Constraints: latency SLA, uptime target, consistency vs availability",
      "Priorities: read-heavy vs write-heavy, what can we trade off",
    ],
  },
  {
    phase: "Phase 2",
    title: "Define Success Metrics",
    time: "2–3 min",
    color: "border-emerald-500 bg-emerald-500/10",
    steps: [
      "Specific: 'p99 latency < 200ms, 99.95% availability'",
      "Not vague: 'the system should be fast'",
      "Commit to what you're optimizing for",
    ],
  },
  {
    phase: "Phase 3",
    title: "Sketch Baseline Architecture",
    time: "10–15 min",
    color: "border-amber-500 bg-amber-500/10",
    steps: [
      "Simplest thing that satisfies the constraints",
      "API boundary + data model + storage choice + request trace",
      "No premature optimization",
    ],
  },
  {
    phase: "Phase 4",
    title: "Scale, Reliability & Operations",
    time: "15–20 min",
    color: "border-purple-500 bg-purple-500/10",
    steps: [
      "Name the first bottleneck + mitigation",
      "Name the first failure mode + degrade path",
      "Define production signals to monitor",
    ],
  },
  {
    phase: "Phase 5",
    title: "Handle Follow-ups",
    time: "5–10 min",
    color: "border-red-500 bg-red-500/10",
    steps: [
      "When constraint changes: what changes, why, new trade-off",
      "Don't flail — adapt one axis at a time",
      "Confirm alignment: 'Does this match what you want to evaluate?'",
    ],
  },
];

// ─── Drill Links mapping each failure reason to the most relevant tool ──────────
const DRILL_LINKS: Record<
  number,
  { label: string; anchor: string; color: string }
> = {
  1: {
    label: "Practice in Guided Walkthrough",
    anchor: "sd-guided-walkthrough",
    color:
      "text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20",
  },
  2: {
    label: "Try Trade-off Simulator",
    anchor: "sd-tradeoff-simulator",
    color:
      "text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20",
  },
  3: {
    label: "Open Scale Estimation Calculator",
    anchor: "sysdesign-capacity-calc",
    color:
      "text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20",
  },
  4: {
    label: "Use Time-Boxed Practice Timer",
    anchor: "sd-time-boxed-timer",
    color:
      "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20",
  },
  5: {
    label: "Open Scale Estimation Calculator",
    anchor: "sysdesign-capacity-calc",
    color:
      "text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20",
  },
  6: {
    label: "Run Anti-Pattern Detector",
    anchor: "sd-anti-pattern-detector",
    color: "text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20",
  },
  7: {
    label: "Run Anti-Pattern Detector",
    anchor: "sd-anti-pattern-detector",
    color: "text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20",
  },
  8: {
    label: "Browse Meta Component Library",
    anchor: "sd-meta-component-library",
    color:
      "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20",
  },
};

// ─── Self-Assessment data ────────────────────────────────────────────────────
const SELF_ASSESSMENT_QUESTIONS = [
  {
    rank: 1,
    question:
      "In your last mock or real interview, did you spend at least 5 minutes clarifying requirements before drawing anything?",
    riskLabel: "Skips Requirements",
  },
  {
    rank: 2,
    question:
      "Can you articulate a trade-off you made in a recent design with a specific measurable justification (e.g., 'I accepted X ms staleness to reduce write latency by Y%')?",
    riskLabel: "No Trade-off Articulation",
  },
  {
    rank: 3,
    question:
      "When asked to design a system, do you proactively estimate QPS, storage, and bandwidth before starting the architecture?",
    riskLabel: "Ignores Scale",
  },
  {
    rank: 4,
    question:
      "In a 45-minute mock, do you consistently cover all 5 phases (requirements, metrics, baseline, scale/reliability, follow-ups)?",
    riskLabel: "Poor Time Management",
  },
  {
    rank: 5,
    question:
      "Before adding Kafka, microservices, or caching to a design, do you first name the specific bottleneck that justifies it?",
    riskLabel: "Premature Optimization",
  },
  {
    rank: 6,
    question:
      "For every critical dependency in your designs, do you discuss what happens when it fails and what the degraded path is?",
    riskLabel: "Ignores Failure Modes",
  },
  {
    rank: 7,
    question:
      "Do you start with the simplest monolithic baseline and only add microservices when a specific constraint forces it?",
    riskLabel: "Over-engineering",
  },
  {
    rank: 8,
    question:
      "When choosing a database, do you derive the schema and partition key from the access patterns (not from familiarity)?",
    riskLabel: "Weak Data Model",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FailurePatternSelfAssessment() {
  const [answers, setAnswers] = useState<
    Record<number, "yes" | "no" | "sometimes" | null>
  >(Object.fromEntries(SELF_ASSESSMENT_QUESTIONS.map(q => [q.rank, null])));
  const [submitted, setSubmitted] = useState(false);

  const topRisks = submitted
    ? SELF_ASSESSMENT_QUESTIONS.filter(
        q => answers[q.rank] === "no" || answers[q.rank] === "sometimes"
      ).slice(0, 3)
    : [];

  const allAnswered = SELF_ASSESSMENT_QUESTIONS.every(
    q => answers[q.rank] !== null
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardCheck size={14} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-foreground">
          Failure Pattern Self-Assessment
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Answer honestly — this produces your personalised top-3 failure risks
        based on the research data above.
      </p>
      {submitted && topRisks.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 space-y-2">
          <p className="text-xs font-bold text-red-400">
            Your Top {topRisks.length} Failure Risk
            {topRisks.length > 1 ? "s" : ""}
          </p>
          {topRisks.map(q => (
            <div key={q.rank} className="flex items-start gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold shrink-0 mt-0.5">
                {q.rank}
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {q.riskLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {answers[q.rank] === "sometimes"
                    ? "You do this inconsistently — make it a habit."
                    : "You consistently skip this — it is your highest-priority gap."}
                </p>
                {DRILL_LINKS[q.rank] && (
                  <button
                    onClick={() => {
                      const el = document.getElementById(
                        DRILL_LINKS[q.rank].anchor
                      );
                      if (el)
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                    className={`mt-1.5 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border font-medium transition-all ${DRILL_LINKS[q.rank].color}`}
                  >
                    <ArrowRight size={10} />
                    {DRILL_LINKS[q.rank].label}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {submitted && topRisks.length === 0 && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <p className="text-xs font-bold text-emerald-400">
            No critical gaps detected
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your answers suggest strong fundamentals. Focus on the L7 signals in
            each failure reason to push from hire to strong hire.
          </p>
        </div>
      )}
      <div className="space-y-3">
        {SELF_ASSESSMENT_QUESTIONS.map(q => (
          <div
            key={q.rank}
            className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2"
          >
            <p className="text-xs text-foreground">
              <span className="font-semibold text-muted-foreground mr-1.5">
                Q{q.rank}.
              </span>
              {q.question}
            </p>
            <div className="flex gap-2">
              {(["yes", "sometimes", "no"] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    setAnswers(prev => ({ ...prev, [q.rank]: opt }));
                    setSubmitted(false);
                  }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-all ${
                    answers[q.rank] === opt
                      ? opt === "yes"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : opt === "sometimes"
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                          : "bg-red-500/20 border-red-500/50 text-red-400"
                      : "bg-background border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {opt === "yes"
                    ? "Yes"
                    : opt === "sometimes"
                      ? "Sometimes"
                      : "No"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setSubmitted(true)}
        disabled={!allAnswered}
        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all"
      >
        {allAnswered
          ? "Show My Top Failure Risks"
          : `Answer all ${SELF_ASSESSMENT_QUESTIONS.filter(q => answers[q.rank] === null).length} remaining questions`}
      </button>
    </div>
  );
}

function InterviewerPerspectiveSimulator() {
  const [designSummary, setDesignSummary] = useState("");
  const [result, setResult] = useState<{
    feedback: string;
    failurePatterns: string[];
    rubricScores: Record<string, string>;
    verdict: string;
  } | null>(null);
  const [error, setError] = useState("");

  const simulate = trpc.ai.interviewerPerspective.useMutation({
    onSuccess: data => {
      try {
        const parsed = JSON.parse(data.content);
        setResult(parsed);
      } catch {
        setError("Failed to parse AI response. Please try again.");
      }
    },
    onError: () => setError("AI service unavailable. Please try again."),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bot size={14} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-foreground">
          Interviewer Perspective Simulator
        </h3>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
          AI
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste a summary of your system design (2–5 sentences). The AI responds
        as a Meta interviewer, identifying which failure patterns it detected
        and scoring each rubric axis.
      </p>
      <textarea
        value={designSummary}
        onChange={e => {
          setDesignSummary(e.target.value);
          setResult(null);
          setError("");
        }}
        placeholder="e.g. I'd build a distributed news feed using a push-based fanout model. Users post to a write service that publishes to Kafka. A fanout worker reads from Kafka and writes to each follower's Redis sorted set. Reads hit Redis first, falling back to MySQL. I'd add a CDN for media."
        className="w-full h-28 text-xs bg-secondary border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {result && (
        <div className="space-y-3">
          <div
            className={`p-3 rounded-lg border font-semibold text-sm ${
              result.verdict.includes("L7")
                ? "border-purple-500/40 bg-purple-500/10 text-purple-400"
                : result.verdict.includes("L6")
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-400"
            }`}
          >
            {result.verdict}
          </div>
          {result.failurePatterns.length > 0 && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-1">
              <p className="text-xs font-semibold text-red-400">
                Failure patterns detected:
              </p>
              {result.failurePatterns.map((p, i) => (
                <p
                  key={i}
                  className="text-xs text-muted-foreground flex items-start gap-1.5"
                >
                  <span className="text-red-400 shrink-0">•</span>
                  {p}
                </p>
              ))}
            </div>
          )}
          <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Rubric axis scores:
            </p>
            {Object.entries(result.rubricScores).map(([axis, score]) => (
              <div key={axis} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-40 shrink-0">
                  {axis}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    score === "Strong"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : score === "Adequate"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {score}
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs font-semibold text-foreground mb-1">
              Interviewer feedback:
            </p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {result.feedback}
            </p>
          </div>
        </div>
      )}
      <button
        onClick={() => simulate.mutate({ designSummary })}
        disabled={designSummary.trim().length < 30 || simulate.isPending}
        className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all"
      >
        {simulate.isPending
          ? "Analyzing as Meta Interviewer..."
          : "Simulate Interviewer Perspective"}
      </button>
    </div>
  );
}

function PassRateFunnel() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
        <TrendingDown size={14} className="text-red-400" />
        Meta Interview Funnel — Pass Rates
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Sources: IGotAnOffer (Apr 2025), DesignGurus (2024), Blind community
        data
      </p>
      <div className="space-y-3">
        {PASS_RATE_FUNNEL.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-36 text-xs text-muted-foreground shrink-0">
              {item.stage}
            </div>
            <div className="flex-1 bg-secondary rounded-full h-5 relative overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all`}
                style={{ width: item.rate }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-plus-lighter">
                {item.rate}
              </span>
            </div>
            <div className="w-44 text-xs text-muted-foreground shrink-0">
              {item.note}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <p className="text-xs text-red-300 font-medium">
          System design is the round most likely to end your candidacy.
          Candidates who fail the Meta loop disproportionately stumble here.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          — Exponent Meta System Design Interview Guide, March 2026
        </p>
      </div>
    </div>
  );
}

function FailureReasonCard({
  reason,
  isOpen,
  onToggle,
}: {
  reason: (typeof FAILURE_REASONS)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = reason.icon;
  return (
    <div
      className={`rounded-xl border transition-all ${isOpen ? "border-blue-500/40 bg-blue-500/5" : "border-border bg-card"}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-xs font-bold text-muted-foreground shrink-0">
          {reason.rank}
        </div>
        <Icon size={14} className="text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              {reason.title}
            </span>
            <span className={`text-xs font-medium ${reason.frequencyColor}`}>
              {reason.frequency}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {reason.description}
          </p>
        </div>
        {isOpen ? (
          <ChevronUp size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <div className="p-3 rounded-lg bg-secondary/50 border-l-2 border-amber-500">
            <p className="text-xs italic text-muted-foreground">
              {reason.metaFeedback}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-400 mb-1">
              How to fix it
            </p>
            <p className="text-xs text-muted-foreground">{reason.fix}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-1">
              L7 signal
            </p>
            <p className="text-xs text-muted-foreground">{reason.ic7Signal}</p>
          </div>
          {DRILL_LINKS[reason.rank] && (
            <button
              onClick={() => {
                const el = document.getElementById(
                  DRILL_LINKS[reason.rank].anchor
                );
                if (el)
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${DRILL_LINKS[reason.rank].color}`}
            >
              <ArrowRight size={11} />
              Practice: {DRILL_LINKS[reason.rank].label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function RubricTable() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        The 8-Axis Interviewer Rubric
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Source: Beyz AI System Design Interview Rubric, Feb 2026 — used by Meta
        interviewers
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-3 text-muted-foreground font-medium w-40">
                Axis
              </th>
              <th className="text-left py-2 pr-3 text-emerald-400 font-medium">
                Strong Signal
              </th>
              <th className="text-left py-2 pr-3 text-red-400 font-medium">
                Weak Signal
              </th>
              <th className="text-left py-2 text-muted-foreground font-medium w-20">
                Weight
              </th>
            </tr>
          </thead>
          <tbody>
            {RUBRIC_AXES.map((row, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  {row.axis}
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {row.strong}
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {row.weak}
                </td>
                <td className="py-2.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      row.weight === "Very High"
                        ? "bg-red-500/20 text-red-400"
                        : row.weight === "High"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {row.weight}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function L6vsL7Table() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        L4 vs L5 vs L6 vs L7 — System Design Differentiators
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        What separates a hire at L6 from a hire at L7 in the system design round
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-3 text-muted-foreground font-medium w-32">
                Dimension
              </th>
              <th className="text-left py-2 pr-3 text-blue-400 font-medium">
                L6 (Strong Hire)
              </th>
              <th className="text-left py-2 text-purple-400 font-medium">
                L7 (Exceptional)
              </th>
            </tr>
          </thead>
          <tbody>
            {L6_VS_L7.map((row, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  {row.dimension}
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">{row.ic6}</td>
                <td className="py-2.5 text-muted-foreground">{row.ic7}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FrameworkGuide() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        The Framework That Works — 5 Phases in 45 Minutes
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Derived from analysis of 12+ failed and successful interviews (Medium,
        Feb 2026)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {FRAMEWORK_PHASES.map((phase, i) => (
          <div key={i} className={`rounded-lg border-l-4 p-3 ${phase.color}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-foreground">
                {phase.phase}
              </span>
              <span className="text-xs text-muted-foreground">
                {phase.time}
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground mb-2">
              {phase.title}
            </p>
            <ul className="space-y-1">
              {phase.steps.map((step, j) => (
                <li
                  key={j}
                  className="text-xs text-muted-foreground flex items-start gap-1"
                >
                  <span className="text-muted-foreground/50 shrink-0 mt-0.5">
                    ·
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function SystemDesignFailureAnalysis() {
  const [openReason, setOpenReason] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "failures" | "rubric" | "l6l7" | "framework"
  >("failures");

  return (
    <section id="sd-failure-analysis" className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/20 shrink-0 mt-0.5">
          <AlertTriangle size={16} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">
            Why Candidates Fail System Design — Data & Analysis
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evidence-backed failure analysis from 12+ real interview
            experiences, Meta interviewer rubrics, and pass-rate data. Use this
            to identify and fix your specific gaps.
          </p>
        </div>
      </div>

      {/* Pass Rate Funnel */}
      <PassRateFunnel />

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 flex-wrap">
        {[
          { key: "failures", label: "8 Failure Reasons" },
          { key: "rubric", label: "Interviewer Rubric" },
          { key: "l6l7", label: "L6 vs L7" },
          { key: "framework", label: "Winning Framework" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "failures" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            Click any failure reason to see the real interviewer feedback, how
            to fix it, and what L7 looks like.
          </p>
          {FAILURE_REASONS.map(reason => (
            <FailureReasonCard
              key={reason.rank}
              reason={reason}
              isOpen={openReason === reason.rank}
              onToggle={() =>
                setOpenReason(openReason === reason.rank ? null : reason.rank)
              }
            />
          ))}
        </div>
      )}

      {activeTab === "rubric" && <RubricTable />}
      {activeTab === "l6l7" && <L6vsL7Table />}
      {activeTab === "framework" && <FrameworkGuide />}
      {/* Self-Assessment */}
      <FailurePatternSelfAssessment />
      {/* Interviewer Perspective Simulator */}
      <InterviewerPerspectiveSimulator />
      {/* Key Insight Footer */}
      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-start gap-2">
          <CheckCircle2
            size={14}
            className="text-emerald-400 shrink-0 mt-0.5"
          />
          <div>
            <p className="text-xs font-semibold text-emerald-400 mb-1">
              The Core Insight
            </p>
            <p className="text-xs text-muted-foreground">
              System design interviews test{" "}
              <strong className="text-foreground">
                how you think under uncertainty
              </strong>
              , not whether you know the "right" architecture. Candidates who
              pass consistently do three things: they clarify before designing,
              they make trade-offs explicit and measurable, and they proactively
              discuss failure modes. The difference between L6 and L7 is not
              knowledge — it's the depth and proactivity of reasoning.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
