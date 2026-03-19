import { useState, useRef, useEffect, useCallback } from "react";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/data";
import { Brain, Play, Pause, RotateCcw, History, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
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

type HistoryEntry = {
  id: string;
  date: string;
  questionTitle: string;
  level: string;
  scorecard: ScorecardResult;
  answers: string[];
};

const HISTORY_KEY = "sd_mock_history_v1";

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  // Keep last 20 sessions
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-20)));
}

const scoreColor = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-blue-400" : s >= 2 ? "text-amber-400" : "text-red-400";

// ── History Panel ─────────────────────────────────────────────────────────────
function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory().reverse());
  const [expanded, setExpanded] = useState<string | null>(null);

  const deleteEntry = (id: string) => {
    const updated = loadHistory().filter((e) => e.id !== id);
    saveHistory(updated);
    setEntries(updated.slice().reverse());
  };

  if (entries.length === 0) {
    return (
      <div className="prep-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={14} className="text-blue-400" />
            <span className="text-sm font-bold text-foreground">Mock Session History</span>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">✕ Close</button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-3xl mb-2">📋</div>
          <div className="text-sm">No completed sessions yet.</div>
          <div className="text-xs mt-1">Complete a mock session to see your history here.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="prep-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={14} className="text-blue-400" />
          <span className="text-sm font-bold text-foreground">Mock Session History</span>
          <span className="badge badge-blue">{entries.length} session{entries.length !== 1 ? "s" : ""}</span>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">✕ Close</button>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-border bg-secondary overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground truncate">{entry.questionTitle}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="badge badge-blue">{entry.level}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</span>
                  <span className={`text-xs font-bold ${scoreColor(entry.scorecard.overallScore)}`}>
                    {entry.scorecard.overallScore.toFixed(1)}/5
                  </span>
                  <span className={`text-xs font-bold ${entry.scorecard.icLevel === "IC7" ? "text-violet-400" : entry.scorecard.icLevel === "IC6" ? "text-blue-400" : "text-muted-foreground"}`}>
                    {entry.scorecard.icLevel}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expanded === entry.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Expanded detail */}
            {expanded === entry.id && (
              <div className="border-t border-border p-3 space-y-3">
                {/* Score grid */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { label: "Overall", score: entry.scorecard.overallScore },
                    { label: "Requirements", score: entry.scorecard.requirementsScore },
                    { label: "Architecture", score: entry.scorecard.architectureScore },
                    { label: "Scalability", score: entry.scorecard.scalabilityScore },
                    { label: "Communication", score: entry.scorecard.communicationScore },
                  ].map(({ label, score }) => (
                    <div key={label} className="text-center">
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                      <div className={`text-base font-black ${scoreColor(score)}`}>{score.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div className="text-xs text-muted-foreground leading-relaxed">{entry.scorecard.summary}</div>
                {/* Answers */}
                <div className="space-y-2">
                  {MOCK_PHASES.map((p, i) => entry.answers[i] && (
                    <div key={i}>
                      <div className="text-[10px] font-bold text-violet-400 mb-0.5">{p.phase}</div>
                      <div className="text-[11px] text-foreground leading-relaxed bg-background rounded p-2 border border-border whitespace-pre-wrap">{entry.answers[i]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SystemDesignMockSession() {
  const [view, setView] = useState<"entry" | "picker" | "idle" | "running" | "done" | "history">("entry");
  const [levelFilter, setLevelFilter] = useState<"All" | "IC6+" | "IC7+">("All");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MOCK_PHASES[0].time);
  const [running, setRunning] = useState(false);
  const [answers, setAnswers] = useState<string[]>(Array(MOCK_PHASES.length).fill(""));
  const [scorecard, setScorecard] = useState<ScorecardResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scoreMutation = trpc.ai.sysDesignMockScorecard.useMutation();

  const filteredQuestions = SYSTEM_DESIGN_QUESTIONS.filter(
    (q) => levelFilter === "All" || q.level === levelFilter
  );

  const question =
    selectedIdx !== null
      ? SYSTEM_DESIGN_QUESTIONS[selectedIdx]
      : SYSTEM_DESIGN_QUESTIONS[0];

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
      setView("done");
      try {
        const result = await scoreMutation.mutateAsync({
          questionTitle: question.title,
          level: question.level,
          tags: question.tags,
          phases: MOCK_PHASES.map((p, i) => ({ phase: p.phase, answer: answers[i] })),
        });
        setScorecard(result);
        // Persist to history
        const entry: HistoryEntry = {
          id: `${Date.now()}`,
          date: new Date().toISOString(),
          questionTitle: question.title,
          level: question.level,
          scorecard: result,
          answers,
        };
        const existing = loadHistory();
        saveHistory([...existing, entry]);
      } catch {
        toast.error("AI scorecard failed. Please try again.");
      }
    }
  };

  const resetAll = () => {
    pauseTimer();
    setView("entry");
    setStep(0);
    setTimeLeft(MOCK_PHASES[0].time);
    setRunning(false);
    setAnswers(Array(MOCK_PHASES.length).fill(""));
    setScorecard(null);
    setShowHint(false);
    setSelectedIdx(null);
  };

  const historyCount = loadHistory().length;

  // ── Entry card ──────────────────────────────────────────────────────────────
  if (view === "entry") {
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
                {historyCount > 0 && <span className="badge badge-gray">{historyCount} past</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Full 5-phase mock round — Requirements → HLD → Deep Dive → Trade-offs — with timer and AI evaluation
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {historyCount > 0 && (
              <button
                onClick={() => setView("history")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
              >
                <History size={12} /> History
              </button>
            )}
            <button
              onClick={() => setView("picker")}
              className="px-4 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 text-sm font-semibold transition-all"
            >
              Start Mock
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── History view ────────────────────────────────────────────────────────────
  if (view === "history") {
    return <HistoryPanel onClose={() => setView("entry")} />;
  }

  // ── Question picker ─────────────────────────────────────────────────────────
  if (view === "picker") {
    return (
      <div className="prep-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-violet-400" />
          <span className="text-sm font-bold text-foreground">Choose Your Question</span>
        </div>

        {/* Level filter */}
        <div className="flex gap-2">
          {(["All", "IC6+", "IC7+"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                levelFilter === lvl
                  ? "bg-violet-500/20 border-violet-500/30 text-violet-400"
                  : "bg-secondary border-border text-muted-foreground hover:border-violet-500/30"
              }`}
            >
              {lvl === "All" ? "All Levels" : lvl}
            </button>
          ))}
          <button
            onClick={() => {
              const pool = filteredQuestions;
              const picked = pool[Math.floor(Math.random() * pool.length)];
              const idx = SYSTEM_DESIGN_QUESTIONS.indexOf(picked);
              setSelectedIdx(idx);
              setView("idle");
            }}
            className="ml-auto px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all"
          >
            🎲 Random
          </button>
        </div>

        {/* Question list */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredQuestions.map((q) => {
            const idx = SYSTEM_DESIGN_QUESTIONS.indexOf(q);
            return (
              <button
                key={idx}
                onClick={() => { setSelectedIdx(idx); setView("idle"); }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedIdx === idx
                    ? "bg-violet-500/15 border-violet-500/40"
                    : "bg-secondary border-border hover:border-violet-500/30"
                }`}
              >
                <div className="text-sm font-semibold text-foreground">{q.title}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="badge badge-blue">{q.level}</span>
                  {q.tags.map((t) => <span key={t} className="badge badge-gray">{t}</span>)}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setView("entry")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Cancel
        </button>
      </div>
    );
  }

  // ── Idle — confirm question ─────────────────────────────────────────────────
  if (view === "idle") {
    return (
      <div className="prep-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={14} className="text-violet-400" />
          <span className="text-sm font-bold text-foreground">System Design Mock Session</span>
          <span className="badge badge-purple">5 phases · ~38 min</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Simulates a real Meta system design round. Work through all 5 framework phases with a timer, capture your answers, then receive an AI scorecard with IC-level assessment.
        </p>

        {/* Selected question */}
        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
          <div className="text-xs font-bold text-violet-400 mb-1">Your Question</div>
          <div className="text-base font-black text-foreground mb-2">{question.title}</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="badge badge-blue">{question.level}</span>
            {question.tags.map((t) => <span key={t} className="badge badge-gray">{t}</span>)}
          </div>
          <button
            onClick={() => setView("picker")}
            className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            ← Change question
          </button>
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
            onClick={() => setView("running")}
            className="px-5 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-all"
          >
            🚀 Start Mock Session
          </button>
          <button
            onClick={() => setView("entry")}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-sm font-semibold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Done — scorecard ────────────────────────────────────────────────────────
  if (view === "done") {
    return (
      <div className="prep-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-emerald-400" />
          <span className="text-sm font-bold text-foreground">Mock Complete</span>
          <span className="badge badge-green">Session done</span>
        </div>

        <div className="p-3 rounded-lg bg-secondary border border-border">
          <div className="text-xs text-muted-foreground mb-0.5">Question</div>
          <div className="text-sm font-bold text-foreground">{question.title}</div>
        </div>

        {scoreMutation.isPending && (
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center">
            <div className="text-sm text-violet-400 animate-pulse">🤖 AI is evaluating your session…</div>
            <div className="text-xs text-muted-foreground mt-1">This may take 10–20 seconds</div>
          </div>
        )}

        {scorecard && (
          <div className="space-y-4">
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
                <div className={`text-xl font-black ${scorecard.icLevel === "IC7" ? "text-violet-400" : scorecard.icLevel === "IC6" ? "text-blue-400" : "text-muted-foreground"}`}>
                  {scorecard.icLevel}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs font-bold text-blue-400 mb-1">📝 AI Summary</div>
              <div className="text-xs text-foreground leading-relaxed">{scorecard.summary}</div>
            </div>

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

        <div className="flex gap-2">
          <button
            onClick={resetAll}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-sm font-semibold text-foreground transition-all"
          >
            🔄 Start New Mock
          </button>
          <button
            onClick={() => setView("history")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-sm font-semibold transition-all"
          >
            <History size={13} /> View History
          </button>
        </div>
      </div>
    );
  }

  // ── Running phase ───────────────────────────────────────────────────────────
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
              cx="50" cy="50" r={r} fill="none"
              stroke={timeLeft <= 60 ? "oklch(0.65 0.22 25)" : timeLeft <= 120 ? "oklch(0.78 0.18 85)" : "oklch(0.62 0.19 290)"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="mono text-base font-bold text-foreground">{mm}:{ss}</span>
            <span className="text-[9px] text-muted-foreground">{Math.floor(currentPhase.time / 60)}m total</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-purple">{currentPhase.phase}</span>
            <span className="text-xs text-muted-foreground">{Math.floor(currentPhase.time / 60)} min allocated</span>
          </div>

          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <div className="text-xs text-violet-400 font-bold mb-1">Design Question</div>
            <div className="text-sm font-bold text-foreground">{question.title}</div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="badge badge-blue">{question.level}</span>
              {question.tags.map((t) => <span key={t} className="badge badge-gray">{t}</span>)}
            </div>
          </div>

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

          <textarea
            value={answers[step]}
            onChange={(e) =>
              setAnswers((a) => { const n = [...a]; n[step] = e.target.value; return n; })
            }
            placeholder={`Write your ${currentPhase.phase} answer here… (bullet points, notes, design decisions)`}
            rows={5}
            className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-violet-500/50 resize-none placeholder:text-muted-foreground/50 leading-relaxed"
          />

          <div className="flex gap-2 flex-wrap">
            {!running && (
              <button onClick={startTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 text-xs font-semibold transition-all">
                <Play size={11} /> Start Timer
              </button>
            )}
            {running && (
              <button onClick={pauseTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all">
                <Pause size={11} /> Pause
              </button>
            )}
            <button onClick={resetTimer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all">
              <RotateCcw size={11} /> Reset
            </button>
            <button onClick={goToNextPhase}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all ml-auto">
              {step < MOCK_PHASES.length - 1 ? "Next Phase →" : "🏁 Finish & Score"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
