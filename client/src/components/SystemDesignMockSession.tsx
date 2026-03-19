import { useState, useRef, useEffect, useCallback } from "react";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/data";
import { Brain, Play, Pause, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const MOCK_PHASES = [
  {
    phase: "1. Requirements & Clarification",
    time: 5 * 60,
    hint: "Ask about functional requirements, non-functional (scale, latency, availability), DAU, QPS, data volume, read/write ratio, global vs regional. Clarify: mobile vs web, consistency requirements.",
  },
  {
    phase: "2. Capacity Estimation",
    time: 3 * 60,
    hint: "Estimate storage, bandwidth, compute. Use: daily writes × record size × retention, QPS × avg payload, cache = 20% of daily reads (Pareto). State your assumptions clearly.",
  },
  {
    phase: "3. High-Level Design (HLD)",
    time: 10 * 60,
    hint: "Draw core components: clients, LB, API servers, DB, cache. Define APIs (REST/GraphQL/gRPC). Choose SQL vs NoSQL with justification. Show end-to-end data flow. Identify the core data model.",
  },
  {
    phase: "4. Deep Dive",
    time: 15 * 60,
    hint: "Pick 2-3 components to deep-dive (interviewer may guide). Cover: DB schema & indexing, caching strategy (eviction, TTL), sharding/replication, scalability bottlenecks. Discuss trade-offs explicitly.",
  },
  {
    phase: "5. Bottlenecks & Trade-offs",
    time: 5 * 60,
    hint: "Identify SPOFs, discuss CAP theorem trade-offs, hot spots, thundering herd, cascading failures. Propose monitoring/alerting strategy. Discuss phased rollout for risky changes.",
  },
];

type ScorecardResult = {
  overallScore: number;
  requirementsScore: number;
  architectureScore: number;
  scalabilityScore: number;
  communicationScore: number;
  icLevel: string;
  strengths: string[];
  improvements: string[];
  followUpQuestions: string[];
  summary: string;
};

export function SystemDesignMockSession() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MOCK_PHASES[0].time);
  const [running, setRunning] = useState(false);
  const [answers, setAnswers] = useState<string[]>(Array(MOCK_PHASES.length).fill(""));
  const [scorecard, setScorecard] = useState<ScorecardResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick a random question on mount
  const [question] = useState(() => {
    return SYSTEM_DESIGN_QUESTIONS[Math.floor(Math.random() * SYSTEM_DESIGN_QUESTIONS.length)];
  });

  const scoreMutation = trpc.ai.sysDesignMockScorecard.useMutation();

  const currentPhase = MOCK_PHASES[step];
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const pct = ((currentPhase.time - timeLeft) / currentPhase.time) * 100;
  const r = 38;
  const circ = 2 * Math.PI * r;

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
  }, []);

  const startTimer = useCallback(() => {
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRunning(false);
          toast.info("Time's up for this phase!");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setTimeLeft(MOCK_PHASES[step].time);
  }, [pauseTimer, step]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const goToNextPhase = async () => {
    pauseTimer();
    if (step < MOCK_PHASES.length - 1) {
      const next = step + 1;
      setStep(next);
      setTimeLeft(MOCK_PHASES[next].time);
      setShowHint(false);
    } else {
      setPhase("done");
      try {
        const result = await scoreMutation.mutateAsync({
          questionTitle: question.title,
          level: question.level,
          tags: question.tags,
          phases: MOCK_PHASES.map((p, i) => ({ phase: p.phase, answer: answers[i] })),
        });
        setScorecard(result);
      } catch {
        toast.error("AI scorecard failed. Please try again.");
      }
    }
  };

  const resetAll = () => {
    pauseTimer();
    setPhase("idle");
    setStep(0);
    setTimeLeft(MOCK_PHASES[0].time);
    setRunning(false);
    setAnswers(Array(MOCK_PHASES.length).fill(""));
    setScorecard(null);
    setShowHint(false);
  };

  const scoreColor = (s: number) =>
    s >= 4 ? "text-emerald-400" : s >= 3 ? "text-blue-400" : s >= 2 ? "text-amber-400" : "text-red-400";

  // Collapsed entry card
  if (!open) {
    return (
      <div className="prep-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-violet-500/30 flex items-center justify-center text-xl shrink-0">
              🏗️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">System Design Mock Session</span>
                <span className="badge badge-purple">~38 min</span>
                <span className="badge badge-blue">AI Scorecard</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Full 5-phase mock round — Requirements → HLD → Deep Dive → Trade-offs — with timer and AI evaluation
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 text-sm font-semibold transition-all shrink-0"
          >
            Start Mock
          </button>
        </div>
      </div>
    );
  }

  // Idle — question reveal + phase overview
  if (phase === "idle") {
    return (
      <div className="prep-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={14} className="text-violet-400" />
          <span className="text-sm font-bold text-foreground">System Design Mock Session</span>
          <span className="badge badge-purple">5 phases · ~38 min</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Simulates a real Meta system design round. Work through all 5 framework phases with a timer, capture your answers in text, then receive an AI scorecard with IC-level assessment.
        </p>

        {/* Selected question */}
        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
          <div className="text-xs font-bold text-violet-400 mb-1">Your Question</div>
          <div className="text-base font-black text-foreground mb-2">{question.title}</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="badge badge-blue">{question.level}</span>
            {question.tags.map((t) => (
              <span key={t} className="badge badge-gray">{t}</span>
            ))}
          </div>
        </div>

        {/* Phase overview */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {MOCK_PHASES.map((p, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-secondary border border-border text-center">
              <div className="text-[10px] font-bold text-muted-foreground mb-0.5">Phase {i + 1}</div>
              <div className="text-[11px] font-semibold text-foreground leading-tight">
                {p.phase.replace(/^\d+\.\s*/, "")}
              </div>
              <div className="text-[10px] text-violet-400 mt-0.5">{Math.floor(p.time / 60)} min</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPhase("running")}
            className="px-5 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-all"
          >
            🚀 Start Mock Session
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-sm font-semibold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Done — scorecard
  if (phase === "done") {
    return (
      <div className="prep-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-emerald-400" />
          <span className="text-sm font-bold text-foreground">Mock Complete</span>
          <span className="badge badge-green">Session done</span>
        </div>

        {/* Question recap */}
        <div className="p-3 rounded-lg bg-secondary border border-border">
          <div className="text-xs text-muted-foreground mb-0.5">Question</div>
          <div className="text-sm font-bold text-foreground">{question.title}</div>
        </div>

        {/* Loading scorecard */}
        {scoreMutation.isPending && (
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center">
            <div className="text-sm text-violet-400 animate-pulse">🤖 AI is evaluating your session…</div>
            <div className="text-xs text-muted-foreground mt-1">This may take 10–20 seconds</div>
          </div>
        )}

        {/* Scorecard */}
        {scorecard && (
          <div className="space-y-4">
            {/* Score grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Overall", score: scorecard.overallScore },
                { label: "Requirements", score: scorecard.requirementsScore },
                { label: "Architecture", score: scorecard.architectureScore },
                { label: "Scalability", score: scorecard.scalabilityScore },
                { label: "Communication", score: scorecard.communicationScore },
              ].map(({ label, score }) => (
                <div key={label} className="p-3 rounded-lg bg-secondary border border-border text-center">
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className={`text-2xl font-black stat-num ${scoreColor(score)}`}>{score.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">/5</div>
                </div>
              ))}
              <div className="p-3 rounded-lg bg-secondary border border-border text-center">
                <div className="text-xs text-muted-foreground mb-1">IC Level</div>
                <div
                  className={`text-xl font-black ${
                    scorecard.icLevel === "IC7"
                      ? "text-violet-400"
                      : scorecard.icLevel === "IC6"
                      ? "text-blue-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {scorecard.icLevel}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs font-bold text-blue-400 mb-1">📝 AI Summary</div>
              <div className="text-xs text-foreground leading-relaxed">{scorecard.summary}</div>
            </div>

            {/* Strengths + Improvements */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs font-bold text-emerald-400 mb-2">✅ Strengths</div>
                <ul className="space-y-1">
                  {scorecard.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-foreground leading-relaxed flex gap-1.5">
                      <span className="text-emerald-400 shrink-0">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-xs font-bold text-amber-400 mb-2">💡 Improvements</div>
                <ul className="space-y-1">
                  {scorecard.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-foreground leading-relaxed flex gap-1.5">
                      <span className="text-amber-400 shrink-0">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Follow-up questions */}
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="text-xs font-bold text-violet-400 mb-2">🔍 Follow-up Questions the Interviewer Would Ask</div>
              <ol className="space-y-1.5">
                {scorecard.followUpQuestions.map((q, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-violet-400 font-bold text-xs shrink-0">{i + 1}.</span>
                    <span className="text-xs text-foreground leading-relaxed">{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <button
          onClick={resetAll}
          className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-sm font-semibold text-foreground transition-all"
        >
          🔄 Start New Mock
        </button>
      </div>
    );
  }

  // Running phase
  return (
    <div className="prep-card p-5 space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {MOCK_PHASES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < step ? "bg-emerald-500" : i === step ? "bg-violet-500" : "bg-secondary"
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground shrink-0">
          Phase {step + 1}/{MOCK_PHASES.length}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-5">
        {/* Timer ring */}
        <div className="relative w-24 h-24 shrink-0 mx-auto sm:mx-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="oklch(0.28 0.012 264)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={
                timeLeft <= 60
                  ? "oklch(0.65 0.22 25)"
                  : timeLeft <= 120
                  ? "oklch(0.78 0.18 85)"
                  : "oklch(0.62 0.19 290)"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="mono text-base font-bold text-foreground">{mm}:{ss}</span>
            <span className="text-[9px] text-muted-foreground">{Math.floor(currentPhase.time / 60)}m total</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {/* Phase header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-purple">{currentPhase.phase}</span>
            <span className="text-xs text-muted-foreground">{Math.floor(currentPhase.time / 60)} min allocated</span>
          </div>

          {/* Question */}
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <div className="text-xs text-violet-400 font-bold mb-1">Design Question</div>
            <div className="text-sm font-bold text-foreground">{question.title}</div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="badge badge-blue">{question.level}</span>
              {question.tags.map((t) => (
                <span key={t} className="badge badge-gray">{t}</span>
              ))}
            </div>
          </div>

          {/* Hint toggle */}
          <div>
            <button
              onClick={() => setShowHint((h) => !h)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showHint ? "▲ Hide hint" : "▼ Show phase hint"}
            </button>
            {showHint && (
              <div className="mt-1.5 p-2.5 rounded-lg bg-secondary text-xs text-muted-foreground leading-relaxed">
                {currentPhase.hint}
              </div>
            )}
          </div>

          {/* Answer textarea */}
          <textarea
            value={answers[step]}
            onChange={(e) =>
              setAnswers((a) => {
                const n = [...a];
                n[step] = e.target.value;
                return n;
              })
            }
            placeholder={`Write your ${currentPhase.phase} answer here… (bullet points, notes, design decisions)`}
            rows={5}
            className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-violet-500/50 resize-none placeholder:text-muted-foreground/50 leading-relaxed"
          />

          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            {!running && (
              <button
                onClick={startTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 text-xs font-semibold transition-all"
              >
                <Play size={11} /> Start Timer
              </button>
            )}
            {running && (
              <button
                onClick={pauseTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
              >
                <Pause size={11} /> Pause
              </button>
            )}
            <button
              onClick={resetTimer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
            >
              <RotateCcw size={11} /> Reset
            </button>
            <button
              onClick={goToNextPhase}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all ml-auto"
            >
              {step < MOCK_PHASES.length - 1 ? "Next Phase →" : "🏁 Finish & Score"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
