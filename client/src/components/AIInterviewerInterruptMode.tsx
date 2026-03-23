/**
 * #1 — AI Interviewer Interrupt Mode
 * System Design session where the AI fires disruptive questions every 3–5 minutes.
 * Scores how cleanly the candidate pivots and recovers.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { Zap, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/data";

const INTERRUPT_INTERVAL_MIN = 3 * 60;
const INTERRUPT_INTERVAL_MAX = 5 * 60;
const SESSION_DURATION = 40 * 60;

function randomInterval() {
  return (
    Math.floor(
      Math.random() * (INTERRUPT_INTERVAL_MAX - INTERRUPT_INTERVAL_MIN + 1)
    ) + INTERRUPT_INTERVAL_MIN
  );
}

interface Interrupt {
  id: string;
  question: string;
  timestamp: number;
  candidateResponse: string;
  score?: { score: number; feedback: string; betterResponse: string };
}

const INTERRUPT_STYLES = [
  "clarifying",
  "pivot",
  "deep_dive",
  "challenge",
  "time_pressure",
] as const;

export function AIInterviewerInterruptMode() {
  const [expanded, setExpanded] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [nextInterruptIn, setNextInterruptIn] = useState(0);
  const [currentInterrupt, setCurrentInterrupt] = useState<string | null>(null);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [interrupts, setInterrupts] = useState<Interrupt[]>([]);
  const [designNotes, setDesignNotes] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(
    SYSTEM_DESIGN_QUESTIONS[
      Math.floor(Math.random() * SYSTEM_DESIGN_QUESTIONS.length)
    ]
  );
  const [scoringId, setScoringId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextInterruptRef = useRef(randomInterval());
  const elapsedRef = useRef(0);

  const startInterruptMutation = trpc.ai.interruptModeStart.useMutation();
  const scoreInterruptMutation = trpc.ai.interruptModeScore.useMutation();

  const fireInterrupt = useCallback(async () => {
    const style =
      INTERRUPT_STYLES[Math.floor(Math.random() * INTERRUPT_STYLES.length)];
    try {
      const res = await startInterruptMutation.mutateAsync({
        topic: selectedQuestion.title,
        approach: designNotes || "Candidate is mid-design",
        interruptStyle: style,
      });
      const parsed = JSON.parse(res.content) as { interruptions: string[] };
      const q =
        parsed.interruptions[0] ??
        "Stop — walk me through that decision again.";
      setCurrentInterrupt(q);
      const id = `int-${Date.now()}`;
      setInterrupts(prev => [
        ...prev,
        {
          id,
          question: q,
          timestamp: elapsedRef.current,
          candidateResponse: "",
        },
      ]);
      setScoringId(id);
      toast.warning("⚡ Interviewer interrupts!", {
        description: q,
        duration: 6000,
      });
    } catch {
      // fallback to static interrupt
      const q = "Stop — walk me through that decision again.";
      setCurrentInterrupt(q);
      const id = `int-${Date.now()}`;
      setInterrupts(prev => [
        ...prev,
        {
          id,
          question: q,
          timestamp: elapsedRef.current,
          candidateResponse: "",
        },
      ]);
      setScoringId(id);
      toast.warning("⚡ Interviewer interrupts!", {
        description: q,
        duration: 6000,
      });
    }
    nextInterruptRef.current = randomInterval();
    setNextInterruptIn(nextInterruptRef.current);
  }, [selectedQuestion.title, designNotes, startInterruptMutation]);

  useEffect(() => {
    if (!sessionActive) return;
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(e => e + 1);
      setNextInterruptIn(prev => {
        const next = prev - 1;
        if (next <= 0) {
          fireInterrupt();
          return randomInterval();
        }
        return next;
      });
      if (elapsedRef.current >= SESSION_DURATION) {
        endSession();
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionActive, fireInterrupt]);

  function startSession() {
    setSessionActive(true);
    setSessionDone(false);
    setElapsed(0);
    elapsedRef.current = 0;
    setInterrupts([]);
    setCurrentInterrupt(null);
    nextInterruptRef.current = randomInterval();
    setNextInterruptIn(nextInterruptRef.current);
  }

  function endSession() {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionActive(false);
    setSessionDone(true);
    setCurrentInterrupt(null);
  }

  async function submitInterruptResponse() {
    if (!scoringId || !candidateAnswer.trim()) return;
    const interrupt = interrupts.find(i => i.id === scoringId);
    if (!interrupt) return;
    setInterrupts(prev =>
      prev.map(i =>
        i.id === scoringId ? { ...i, candidateResponse: candidateAnswer } : i
      )
    );
    setCandidateAnswer("");
    setCurrentInterrupt(null);
    try {
      const result = await scoreInterruptMutation.mutateAsync({
        topic: selectedQuestion.title,
        approach: designNotes,
        interruption: interrupt.question,
        response: candidateAnswer,
      });
      const score = JSON.parse(result.content) as {
        score: number;
        feedback: string;
        betterResponse: string;
      };
      setInterrupts(prev =>
        prev.map(i => (i.id === scoringId ? { ...i, score } : i))
      );
    } catch {
      toast.error("Scoring failed — continuing session");
    }
    setScoringId(null);
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const avgScore =
    interrupts.filter(i => i.score).length > 0
      ? interrupts
          .filter(i => i.score)
          .reduce((acc, i) => acc + i.score!.score, 0) /
        interrupts.filter(i => i.score).length
      : null;

  return (
    <div
      id="sd-interrupt-mode"
      className="rounded-xl border-2 border-orange-500/60 bg-gradient-to-br from-orange-950/40 to-red-950/30 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(249,115,22,0.15)" }}
    >
      {/* HIGH IMPACT header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/10 border-b border-orange-500/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black tracking-wider uppercase">
            🔥 Highest Impact
          </span>
          <Zap size={16} className="text-orange-400" />
          <span className="text-sm font-bold text-orange-300">
            AI Interviewer Interrupt Mode
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-orange-400 hover:text-orange-300 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!expanded && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Real Meta interviewers interrupt constantly. Practice pivoting
            mid-thought under pressure — the #1 reason candidates fail system
            design.
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            Start session →
          </button>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-4">
          <div className="flex gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle
              size={14}
              className="text-orange-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-orange-200">
              <strong>Why this matters:</strong> The #1 reason candidates fail
              system design at L6+ is they can't handle being redirected
              mid-thought. This drill trains the pivot-and-recover muscle that
              no other tool builds.
            </p>
          </div>

          {/* Question picker */}
          {!sessionActive && !sessionDone && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Design Question
              </label>
              <select
                value={selectedQuestion.title}
                onChange={e => {
                  const q = SYSTEM_DESIGN_QUESTIONS.find(
                    sq => sq.title === e.target.value
                  );
                  if (q) setSelectedQuestion(q);
                }}
                className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground"
              >
                {SYSTEM_DESIGN_QUESTIONS.map(q => (
                  <option key={q.title} value={q.title}>
                    {q.title} ({q.level})
                  </option>
                ))}
              </select>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Design Notes (optional — helps AI generate relevant
                  interrupts)
                </label>
                <textarea
                  value={designNotes}
                  onChange={e => setDesignNotes(e.target.value)}
                  placeholder="Jot down your initial approach, key components, data model…"
                  rows={3}
                  className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
              <button
                onClick={startSession}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition-colors"
              >
                <Zap size={14} />
                Start 40-Minute Interrupt Session
              </button>
            </div>
          )}

          {/* Active session */}
          {sessionActive && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Elapsed:{" "}
                  <strong className="text-foreground">{fmt(elapsed)}</strong>
                </span>
                <span className="text-muted-foreground">
                  Next interrupt in:{" "}
                  <strong className="text-orange-400">
                    {fmt(nextInterruptIn)}
                  </strong>
                </span>
                <button
                  onClick={endSession}
                  className="px-3 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-600/30 transition-colors"
                >
                  End Session
                </button>
              </div>

              {/* Active interrupt */}
              {currentInterrupt && (
                <div className="rounded-xl border-2 border-orange-500 bg-orange-500/10 p-4 space-y-3 animate-pulse-once">
                  <div className="flex items-start gap-2">
                    <Zap
                      size={16}
                      className="text-orange-400 shrink-0 mt-0.5"
                    />
                    <p className="text-sm font-semibold text-orange-200">
                      {currentInterrupt}
                    </p>
                  </div>
                  <textarea
                    value={candidateAnswer}
                    onChange={e => setCandidateAnswer(e.target.value)}
                    placeholder="Respond to the interruption…"
                    rows={3}
                    className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none"
                    autoFocus
                  />
                  <button
                    onClick={submitInterruptResponse}
                    disabled={
                      !candidateAnswer.trim() ||
                      scoreInterruptMutation.isPending
                    }
                    className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                  >
                    {scoreInterruptMutation.isPending
                      ? "Scoring…"
                      : "Submit Response"}
                  </button>
                </div>
              )}

              {!currentInterrupt && (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  Continue designing… an interrupt will fire in{" "}
                  {fmt(nextInterruptIn)}
                </div>
              )}
            </div>
          )}

          {/* Session done */}
          {sessionDone && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <div className="text-lg font-black text-emerald-400">
                  Session Complete!
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {interrupts.length} interrupts handled
                  {avgScore !== null && (
                    <>
                      {" "}
                      · Avg score:{" "}
                      <strong className="text-emerald-400">
                        {avgScore.toFixed(1)}/5
                      </strong>
                    </>
                  )}
                </div>
              </div>

              {/* Interrupt log */}
              <div className="space-y-2">
                {interrupts.map((int, idx) => (
                  <div
                    key={int.id}
                    className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-orange-400 uppercase">
                        Interrupt #{idx + 1} · {fmt(int.timestamp)}
                      </span>
                      {int.score && (
                        <span
                          className={`text-[10px] font-black ${int.score.score >= 4 ? "text-emerald-400" : int.score.score >= 3 ? "text-amber-400" : "text-red-400"}`}
                        >
                          {int.score.score}/5
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-orange-200">{int.question}</p>
                    {int.candidateResponse && (
                      <p className="text-xs text-muted-foreground italic">
                        "{int.candidateResponse}"
                      </p>
                    )}
                    {int.score && (
                      <div className="text-xs text-emerald-300 mt-1">
                        <Streamdown>{int.score.feedback}</Streamdown>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setSessionDone(false);
                  setInterrupts([]);
                  setElapsed(0);
                }}
                className="w-full px-4 py-2 rounded-xl bg-orange-600/20 border border-orange-500/30 text-orange-400 text-sm font-semibold hover:bg-orange-600/30 transition-colors"
              >
                New Session
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
