// Mock Interview Simulator
// 45-minute session: 25 min coding + 10 min BQ1 + 10 min BQ2
// Generates LLM post-session debrief with IC-level assessment
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Square,
  ChevronRight,
  RotateCcw,
  Zap,
  X,
  Timer,
  Code2,
  Brain,
  Trophy,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  useSimulatorHistory,
  type SimulatorSession,
} from "@/hooks/useLocalStorage";

// ── Types ──────────────────────────────────────────────────────────────────
type Phase = "setup" | "coding" | "bq1" | "bq2" | "debrief";

interface SessionState {
  icTarget: "L5" | "L6" | "L7";
  codingProblem: string;
  codingNotes: string;
  codingTimeUsed: number;
  bq1Question: string;
  bq1Answer: string;
  bq2Question: string;
  bq2Answer: string;
  startedAt: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const PHASE_DURATIONS: Record<Exclude<Phase, "setup" | "debrief">, number> = {
  coding: 25 * 60,
  bq1: 10 * 60,
  bq2: 10 * 60,
};

function fmtTime(secs: number) {
  const m = String(Math.floor(Math.abs(secs) / 60)).padStart(2, "0");
  const s = String(Math.abs(secs) % 60).padStart(2, "0");
  return `${secs < 0 ? "-" : ""}${m}:${s}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function verdictColor(v: string) {
  if (v === "Strong Hire")
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (v === "Hire") return "text-blue-400 bg-blue-500/10 border-blue-500/30";
  if (v === "Borderline")
    return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  return "text-red-400 bg-red-500/10 border-red-500/30";
}

// ── Circular Timer ─────────────────────────────────────────────────────────
function CircularTimer({
  timeLeft,
  total,
}: {
  timeLeft: number;
  total: number;
}) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, timeLeft / total);
  const urgent = timeLeft <= 60;
  const warning = timeLeft <= 180;
  const color = urgent
    ? "oklch(0.65 0.22 25)"
    : warning
      ? "oklch(0.78 0.17 75)"
      : "oklch(0.58 0.2 265)";

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="oklch(0.28 0.012 264)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-mono text-xl font-extrabold ${urgent ? "text-red-400" : warning ? "text-amber-400" : "text-foreground"}`}
        >
          {fmtTime(timeLeft)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">remaining</span>
      </div>
    </div>
  );
}

// ── Score Bar ──────────────────────────────────────────────────────────────
function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-bold ${color}`}>{value}/5</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`}
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MockInterviewSimulator() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<SessionState | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(
    null
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseStartRef = useRef<number>(0);
  const [simulatorHistory, setSimulatorHistory] = useSimulatorHistory();

  const debriefMutation = trpc.ctci.generateDebrief.useMutation({
    onError: () => toast.error("Debrief generation failed. Try again."),
  });

  // ── Timer ──────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
  }, []);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (timeLeft <= 0 && running) {
      stopTimer();
      toast.info("Time's up for this section!");
    }
  }, [timeLeft, running, stopTimer]);

  // ── Setup ──────────────────────────────────────────────────────────────
  const startSession = (icTarget: "L5" | "L6" | "L7") => {
    const codingPattern = pickRandom(PATTERNS);
    const bqs = [...BEHAVIORAL_QUESTIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    const s: SessionState = {
      icTarget,
      codingProblem: `${codingPattern.name} — ${codingPattern.examples[0]}`,
      codingNotes: "",
      codingTimeUsed: 0,
      bq1Question: bqs[0].q,
      bq1Answer: "",
      bq2Question: bqs[1].q,
      bq2Answer: "",
      startedAt: Date.now(),
    };
    setSession(s);
    setPhase("coding");
    setTimeLeft(PHASE_DURATIONS.coding);
    phaseStartRef.current = Date.now();
    setRunning(true);
  };

  // ── Advance Phase ──────────────────────────────────────────────────────
  const advancePhase = useCallback(() => {
    if (!session) return;
    const elapsed = Math.floor((Date.now() - phaseStartRef.current) / 1000);
    stopTimer();

    if (phase === "coding") {
      setSession(s => (s ? { ...s, codingTimeUsed: elapsed } : s));
      setPhase("bq1");
      setTimeLeft(PHASE_DURATIONS.bq1);
      phaseStartRef.current = Date.now();
      setRunning(true);
    } else if (phase === "bq1") {
      setPhase("bq2");
      setTimeLeft(PHASE_DURATIONS.bq2);
      phaseStartRef.current = Date.now();
      setRunning(true);
    } else if (phase === "bq2") {
      setPhase("debrief");
      const totalUsed = Math.floor((Date.now() - session.startedAt) / 1000);
      debriefMutation.mutate({
        codingProblem: session.codingProblem,
        codingNotes: session.codingNotes,
        codingTimeUsed: session.codingTimeUsed || elapsed,
        bq1Question: session.bq1Question,
        bq1Answer: session.bq1Answer,
        bq2Question: session.bq2Question,
        bq2Answer: session.bq2Answer,
        icTarget: session.icTarget,
        totalTimeUsed: totalUsed,
      });
    }
  }, [phase, session, stopTimer, debriefMutation]);

  // Save completed session to history
  const saveToHistory = useCallback(
    (sess: SessionState, d: typeof debriefMutation.data) => {
      if (!d) return;
      const record: SimulatorSession = {
        id: Date.now().toString(),
        date: new Date().toISOString().split("T")[0],
        icTarget: sess.icTarget,
        codingProblem: sess.codingProblem,
        codingNotes: sess.codingNotes,
        bq1Question: sess.bq1Question,
        bq1Answer: sess.bq1Answer,
        bq2Question: sess.bq2Question,
        bq2Answer: sess.bq2Answer,
        totalTimeUsed: Math.floor((Date.now() - sess.startedAt) / 1000),
        overallVerdict: d.overallVerdict,
        overallScore: d.overallScore,
        codingScore: d.codingScore,
        behavioralScore: d.behavioralScore,
        levelAssessment: d.levelAssessment,
        codingAssessment: d.codingAssessment,
        behavioralAssessment: d.behavioralAssessment,
        topStrengths: d.topStrengths,
        criticalGaps: d.criticalGaps,
        nextSteps: d.nextSteps,
      };
      setSimulatorHistory(h => [record, ...h].slice(0, 20)); // keep last 20
    },
    [setSimulatorHistory]
  );

  // Auto-save when debrief arrives
  useEffect(() => {
    if (debriefMutation.data && session && phase === "debrief") {
      saveToHistory(session, debriefMutation.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debriefMutation.data]);

  const resetSession = () => {
    stopTimer();
    setPhase("setup");
    setSession(null);
    debriefMutation.reset();
  };

  const phaseLabel: Record<Phase, string> = {
    setup: "Setup",
    coding: "Coding Section",
    bq1: "Behavioral Q1",
    bq2: "Behavioral Q2",
    debrief: "Debrief",
  };

  const phaseIcon: Record<Phase, React.ReactNode> = {
    setup: <Play size={13} />,
    coding: <Code2 size={13} className="text-blue-400" />,
    bq1: <Brain size={13} className="text-purple-400" />,
    bq2: <Brain size={13} className="text-purple-400" />,
    debrief: <Trophy size={13} className="text-amber-400" />,
  };

  const debrief = debriefMutation.data;

  return (
    <div className="prep-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 group"
      >
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-blue-400" />
          <span className="text-sm font-bold text-foreground">
            Mock Interview Simulator
          </span>
          <span className="badge badge-blue">45 min</span>
          {phase !== "setup" && phase !== "debrief" && (
            <span className="badge badge-amber animate-pulse">
              {phaseLabel[phase]}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          1 coding + 2 behavioral · LLM debrief
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Phase progress bar */}
          {phase !== "setup" && (
            <div className="flex border-b border-border">
              {(["coding", "bq1", "bq2", "debrief"] as const).map((p, i) => (
                <div
                  key={p}
                  className={`flex-1 py-2 text-center text-xs font-semibold transition-all ${
                    phase === p
                      ? "bg-blue-600/20 text-blue-400 border-b-2 border-blue-500"
                      : ["coding", "bq1", "bq2", "debrief"].indexOf(phase) > i
                        ? "text-emerald-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {phaseLabel[p]}
                </div>
              ))}
            </div>
          )}

          <div className="p-5">
            {/* ── SETUP ── */}
            {phase === "setup" && (
              <div className="space-y-5">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  A full 45-minute mock interview:{" "}
                  <span className="text-blue-400 font-semibold">
                    25 min coding
                  </span>{" "}
                  →{" "}
                  <span className="text-purple-400 font-semibold">
                    10 min BQ1
                  </span>{" "}
                  →{" "}
                  <span className="text-purple-400 font-semibold">
                    10 min BQ2
                  </span>
                  . Problems are randomly selected. After all three sections, an
                  LLM generates a hiring-bar debrief.
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-3">
                    Select your target level:
                  </div>
                  <div className="flex gap-3">
                    {(["L5", "L6", "L7"] as const).map(ic => (
                      <button
                        key={ic}
                        onClick={() => startSession(ic)}
                        className="flex-1 py-3 rounded-xl border border-border bg-secondary hover:bg-blue-600/20 hover:border-blue-500/50 text-sm font-bold text-foreground transition-all group"
                      >
                        <div className="text-lg mb-0.5">
                          {ic === "L5" ? "🌱" : ic === "L6" ? "🔥" : "⚡"}
                        </div>
                        <div>{ic}</div>
                        <div className="text-xs text-muted-foreground group-hover:text-blue-300 mt-0.5">
                          {ic === "L5"
                            ? "Senior SWE"
                            : ic === "L6"
                              ? "Staff SWE"
                              : "Sr. Staff SWE"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Past Sessions Accordion */}
                {simulatorHistory.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowHistory(h => !h)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <History size={13} className="text-blue-400" />
                        Past Sessions
                        <span className="badge badge-blue">
                          {simulatorHistory.length}
                        </span>
                      </div>
                      {showHistory ? (
                        <ChevronUp
                          size={13}
                          className="text-muted-foreground"
                        />
                      ) : (
                        <ChevronDown
                          size={13}
                          className="text-muted-foreground"
                        />
                      )}
                    </button>
                    {showHistory && (
                      <div className="divide-y divide-border max-h-96 overflow-y-auto">
                        {simulatorHistory.map(s => (
                          <div key={s.id}>
                            <button
                              onClick={() =>
                                setExpandedHistoryId(
                                  expandedHistoryId === s.id ? null : s.id
                                )
                              }
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded border ${verdictColor(s.overallVerdict)}`}
                                >
                                  {s.overallVerdict}
                                </span>
                                <div>
                                  <div className="text-xs font-semibold text-foreground">
                                    {s.icTarget} · {s.date}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate max-w-48">
                                    {s.codingProblem}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-xs text-amber-400">
                                  {[1, 2, 3, 4, 5]
                                    .map(n => (n <= s.overallScore ? "★" : "☆"))
                                    .join("")}
                                </div>
                                {expandedHistoryId === s.id ? (
                                  <ChevronUp
                                    size={11}
                                    className="text-muted-foreground"
                                  />
                                ) : (
                                  <ChevronDown
                                    size={11}
                                    className="text-muted-foreground"
                                  />
                                )}
                              </div>
                            </button>
                            {expandedHistoryId === s.id && (
                              <div className="px-4 pb-4 space-y-3 bg-background/30">
                                <div className="grid sm:grid-cols-2 gap-2">
                                  <div className="p-2 rounded-lg bg-secondary border border-border">
                                    <div className="text-xs font-bold text-blue-400 mb-1">
                                      💻 Coding ({s.codingScore}/5)
                                    </div>
                                    <div className="text-xs text-muted-foreground leading-relaxed">
                                      {s.codingAssessment}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-secondary border border-border">
                                    <div className="text-xs font-bold text-purple-400 mb-1">
                                      🧠 Behavioral ({s.behavioralScore}/5)
                                    </div>
                                    <div className="text-xs text-muted-foreground leading-relaxed">
                                      {s.behavioralAssessment}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-foreground leading-relaxed p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                  <span className="font-bold text-blue-400">
                                    IC Assessment:{" "}
                                  </span>
                                  {s.levelAssessment}
                                </div>
                                {s.nextSteps.length > 0 && (
                                  <div>
                                    <div className="text-xs font-bold text-amber-400 mb-1">
                                      📋 Next Steps
                                    </div>
                                    <ol className="space-y-0.5">
                                      {s.nextSteps.map((step, i) => (
                                        <li
                                          key={i}
                                          className="text-xs text-muted-foreground flex gap-2"
                                        >
                                          <span className="text-amber-400 font-bold shrink-0">
                                            {i + 1}.
                                          </span>
                                          {step}
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── CODING PHASE ── */}
            {phase === "coding" && session && (
              <div className="space-y-4">
                <div className="flex items-start gap-5">
                  <CircularTimer
                    timeLeft={timeLeft}
                    total={PHASE_DURATIONS.coding}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                      Coding Problem
                    </div>
                    <div className="text-sm font-bold text-foreground leading-relaxed">
                      {session.codingProblem}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Think out loud. State your approach before coding. Discuss
                      time/space complexity.
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Your approach / pseudocode / notes
                  </label>
                  <textarea
                    value={session.codingNotes}
                    onChange={e =>
                      setSession(s =>
                        s ? { ...s, codingNotes: e.target.value } : s
                      )
                    }
                    placeholder="Write your approach here: data structure choice, algorithm, edge cases, complexity..."
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none font-mono leading-relaxed"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={advancePhase}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all"
                  >
                    <ChevronRight size={13} /> Next: Behavioral Q1
                  </button>
                  <button
                    onClick={() => setRunning(r => !r)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-all"
                  >
                    {running ? <Square size={12} /> : <Play size={12} />}
                    {running ? "Pause" : "Resume"}
                  </button>
                </div>
              </div>
            )}

            {/* ── BQ PHASES ── */}
            {(phase === "bq1" || phase === "bq2") && session && (
              <div className="space-y-4">
                <div className="flex items-start gap-5">
                  <CircularTimer
                    timeLeft={timeLeft}
                    total={
                      phase === "bq1"
                        ? PHASE_DURATIONS.bq1
                        : PHASE_DURATIONS.bq2
                    }
                  />
                  <div className="flex-1 space-y-2">
                    <div className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                      Behavioral Question {phase === "bq1" ? "1" : "2"}
                    </div>
                    <div className="text-sm font-bold text-foreground leading-relaxed">
                      {phase === "bq1"
                        ? session.bq1Question
                        : session.bq2Question}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Use STAR format. Be specific with metrics and impact.
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Your STAR answer
                  </label>
                  <textarea
                    value={
                      phase === "bq1" ? session.bq1Answer : session.bq2Answer
                    }
                    onChange={e =>
                      setSession(s =>
                        s
                          ? {
                              ...s,
                              [phase === "bq1" ? "bq1Answer" : "bq2Answer"]:
                                e.target.value,
                            }
                          : s
                      )
                    }
                    placeholder="Situation: ...\nTask: ...\nAction: ...\nResult: ..."
                    rows={7}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={advancePhase}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all"
                  >
                    <ChevronRight size={13} />
                    {phase === "bq1"
                      ? "Next: Behavioral Q2"
                      : "Finish & Get Debrief"}
                  </button>
                  <button
                    onClick={() => setRunning(r => !r)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-all"
                  >
                    {running ? <Square size={12} /> : <Play size={12} />}
                    {running ? "Pause" : "Resume"}
                  </button>
                </div>
              </div>
            )}

            {/* ── DEBRIEF PHASE ── */}
            {phase === "debrief" && (
              <div className="space-y-5">
                {debriefMutation.isPending && (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Zap size={28} className="text-amber-400 animate-pulse" />
                    <div className="text-sm font-semibold text-foreground">
                      Generating your debrief…
                    </div>
                    <div className="text-xs text-muted-foreground">
                      The LLM is reviewing your coding approach and behavioral
                      answers
                    </div>
                  </div>
                )}

                {debrief && (
                  <div className="space-y-5">
                    {/* Verdict banner */}
                    <div
                      className={`p-4 rounded-xl border text-center ${verdictColor(debrief.overallVerdict)}`}
                    >
                      <div className="text-2xl font-extrabold mb-1">
                        {debrief.overallVerdict}
                      </div>
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span
                            key={s}
                            className={
                              s <= debrief.overallScore
                                ? "text-amber-400"
                                : "opacity-20"
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* IC level */}
                    <div className="p-3 rounded-lg bg-secondary border border-border">
                      <div className="text-xs font-bold text-blue-400 mb-1">
                        IC-Level Assessment ({session?.icTarget})
                      </div>
                      <div className="text-xs text-foreground leading-relaxed">
                        {debrief.levelAssessment}
                      </div>
                    </div>

                    {/* Score bars */}
                    <div className="space-y-3">
                      <ScoreBar
                        label="Coding Performance"
                        value={debrief.codingScore}
                        color="text-blue-400"
                      />
                      <ScoreBar
                        label="Behavioral Performance"
                        value={debrief.behavioralScore}
                        color="text-purple-400"
                      />
                    </div>

                    {/* Assessments */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-secondary border border-border">
                        <div className="text-xs font-bold text-blue-400 mb-1">
                          💻 Coding
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {debrief.codingAssessment}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary border border-border">
                        <div className="text-xs font-bold text-purple-400 mb-1">
                          🧠 Behavioral
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {debrief.behavioralAssessment}
                        </div>
                      </div>
                    </div>

                    {/* Strengths + Gaps */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {debrief.topStrengths.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-emerald-400 mb-2">
                            ✅ Top Strengths
                          </div>
                          <ul className="space-y-1">
                            {debrief.topStrengths.map(
                              (s: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-xs text-muted-foreground flex gap-2"
                                >
                                  <span className="text-emerald-400 shrink-0">
                                    •
                                  </span>
                                  {s}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                      {debrief.criticalGaps.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-red-400 mb-2">
                            ⚠️ Critical Gaps
                          </div>
                          <ul className="space-y-1">
                            {debrief.criticalGaps.map(
                              (g: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-xs text-muted-foreground flex gap-2"
                                >
                                  <span className="text-red-400 shrink-0">
                                    •
                                  </span>
                                  {g}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Next steps */}
                    {debrief.nextSteps.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-amber-400 mb-2">
                          📋 Next Steps
                        </div>
                        <ol className="space-y-1">
                          {debrief.nextSteps.map((step: string, i: number) => (
                            <li
                              key={i}
                              className="text-xs text-muted-foreground flex gap-2"
                            >
                              <span className="text-amber-400 font-bold shrink-0">
                                {i + 1}.
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={resetSession}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                  <RotateCcw size={13} /> Start New Session
                </button>
              </div>
            )}

            {/* Reset button (non-setup phases) */}
            {phase !== "setup" && phase !== "debrief" && (
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={resetSession}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <X size={11} /> Abandon session
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
