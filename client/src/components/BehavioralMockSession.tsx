import { useState, useRef, useEffect, useCallback } from "react";
import { BEHAVIORAL_QUESTIONS } from "@/lib/data";
import { Brain, Play, Pause, RotateCcw, History, ChevronDown, ChevronUp, Trash2, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Pick 3 random XFN questions for the mock session
const XFN_QUESTIONS = BEHAVIORAL_QUESTIONS.filter((q) => q.area === "XFN Partnership");

const ROUND_TIME = 12 * 60; // 12 minutes per question

const STAR_PHASES = [
  { label: "S — Situation", hint: "Set the scene: who were the stakeholders, what was the context, what was at stake? Be specific about the org structure and your role." },
  { label: "T — Task", hint: "What was YOUR specific responsibility? What did you need to achieve or resolve? Make it clear this was your problem to solve." },
  { label: "A — Action", hint: "Walk through the concrete steps YOU took. Focus on your decisions, your communication strategy, how you navigated disagreement or misalignment." },
  { label: "R — Result", hint: "Quantify the outcome. What changed? What was the business or team impact? What did you learn? Would you do anything differently?" },
];

type XFNScorecardResult = {
  overallScore: number;
  collaborationScore: number;
  conflictScore: number;
  alignmentScore: number;
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
  questions: string[];
  scorecard: XFNScorecardResult;
  answers: string[];
};

const HISTORY_KEY = "beh_mock_history_v1";

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-20)));
}

const scoreColor = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-blue-400" : s >= 2 ? "text-amber-400" : "text-red-400";

// ── History Panel ─────────────────────────────────────────────────────────────
const diffColor = (delta: number) =>
  delta > 0.2 ? "text-emerald-400" : delta < -0.2 ? "text-red-400" : "text-muted-foreground";

const XFN_DIMS = [
  { key: "overallScore" as const, label: "Overall" },
  { key: "collaborationScore" as const, label: "Collaboration" },
  { key: "conflictScore" as const, label: "Conflict Res." },
  { key: "alignmentScore" as const, label: "Alignment" },
  { key: "communicationScore" as const, label: "Communication" },
];

function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory().slice().reverse());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  const deleteEntry = (id: string) => {
    const updated = loadHistory().filter((e) => e.id !== id);
    saveHistory(updated);
    setEntries(updated.slice().reverse());
    if (compareA === id) setCompareA(null);
    if (compareB === id) setCompareB(null);
  };

  const entryA = entries.find(e => e.id === compareA);
  const entryB = entries.find(e => e.id === compareB);

  if (entries.length === 0) {
    return (
      <div className="prep-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={14} className="text-teal-400" />
            <span className="text-sm font-bold text-foreground">XFN Mock History</span>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">✕ Close</button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-3xl mb-2">🤝</div>
          <div className="text-sm">No completed sessions yet.</div>
          <div className="text-xs mt-1">Complete an XFN mock session to see your history here.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="prep-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={14} className="text-teal-400" />
          <span className="text-sm font-bold text-foreground">XFN Mock History</span>
          <span className="badge badge-teal">{entries.length} session{entries.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          {entries.length >= 2 && (
            <button
              onClick={() => { setCompareMode(!compareMode); setCompareA(null); setCompareB(null); }}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                compareMode
                  ? "bg-teal-500/20 border-teal-500/30 text-teal-400"
                  : "bg-secondary border-border text-muted-foreground hover:border-teal-500/30"
              }`}
            >
              {compareMode ? "✕ Cancel Compare" : "⇄ Compare"}
            </button>
          )}
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">✕ Close</button>
        </div>
      </div>

      {/* Comparison diff panel */}
      {compareMode && entryA && entryB && (
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-3">
          <div className="text-xs font-bold text-teal-400">⇄ XFN Session Comparison</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="text-[10px] text-muted-foreground font-semibold">Session A</div>
            <div className="text-[10px] text-muted-foreground font-semibold">Dimension</div>
            <div className="text-[10px] text-muted-foreground font-semibold">Session B</div>
          </div>
          {XFN_DIMS.map(({ key, label }) => {
            const a = entryA.scorecard[key];
            const b = entryB.scorecard[key];
            const delta = b - a;
            return (
              <div key={key} className="grid grid-cols-3 gap-2 items-center">
                <div className={`text-center text-sm font-bold ${scoreColor(a)}`}>{a.toFixed(1)}</div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                  <div className={`text-xs font-bold ${diffColor(delta)}`}>
                    {delta > 0.05 ? `+${delta.toFixed(1)}` : delta < -0.05 ? delta.toFixed(1) : "=="}
                  </div>
                </div>
                <div className={`text-center text-sm font-bold ${scoreColor(b)}`}>{b.toFixed(1)}</div>
              </div>
            );
          })}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="text-center p-2 rounded-lg bg-secondary">
              <div className="text-[10px] text-muted-foreground">Session A</div>
              <div className="text-xs font-bold text-foreground">{new Date(entryA.date).toLocaleDateString()}</div>
              <div className="text-[10px] text-muted-foreground">{entryA.scorecard.icLevel}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <div className="text-[10px] text-muted-foreground">Session B</div>
              <div className="text-xs font-bold text-foreground">{new Date(entryB.date).toLocaleDateString()}</div>
              <div className="text-[10px] text-muted-foreground">{entryB.scorecard.icLevel}</div>
            </div>
          </div>
        </div>
      )}
      {compareMode && (!entryA || !entryB) && (
        <div className="p-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground">
          Select two sessions below to compare them.
        </div>
      )}

      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {entries.map((entry) => (
          <div key={entry.id} className={`rounded-lg border bg-secondary overflow-hidden transition-all ${
            compareMode && (compareA === entry.id || compareB === entry.id)
              ? "border-teal-500/50"
              : "border-border"
          }`}>
            <div className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground truncate">XFN Mock — {new Date(entry.date).toLocaleDateString()}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs font-bold ${scoreColor(entry.scorecard.overallScore)}`}>
                    {entry.scorecard.overallScore.toFixed(1)}/5
                  </span>
                  <span className={`text-xs font-bold ${entry.scorecard.icLevel === "IC7" ? "text-violet-400" : entry.scorecard.icLevel === "IC6" ? "text-blue-400" : "text-muted-foreground"}`}>
                    {entry.scorecard.icLevel}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {compareMode && (
                  <button
                    onClick={() => {
                      if (compareA === entry.id) { setCompareA(null); return; }
                      if (compareB === entry.id) { setCompareB(null); return; }
                      if (!compareA) { setCompareA(entry.id); return; }
                      if (!compareB) { setCompareB(entry.id); return; }
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                      compareA === entry.id ? "bg-teal-500/20 border-teal-500/40 text-teal-400" :
                      compareB === entry.id ? "bg-violet-500/20 border-violet-500/40 text-violet-400" :
                      "bg-secondary border-border text-muted-foreground hover:border-teal-500/30"
                    }`}
                  >
                    {compareA === entry.id ? "A" : compareB === entry.id ? "B" : "+"}
                  </button>
                )}
                <button onClick={() => setExpanded(expanded === entry.id ? null : entry.id)} className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors">
                  {expanded === entry.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {expanded === entry.id && (
              <div className="border-t border-border p-3 space-y-3">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { label: "Overall", score: entry.scorecard.overallScore },
                    { label: "Collaboration", score: entry.scorecard.collaborationScore },
                    { label: "Conflict", score: entry.scorecard.conflictScore },
                    { label: "Alignment", score: entry.scorecard.alignmentScore },
                    { label: "Communication", score: entry.scorecard.communicationScore },
                  ].map(({ label, score }) => (
                    <div key={label} className="text-center">
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                      <div className={`text-base font-black ${scoreColor(score)}`}>{score.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{entry.scorecard.summary}</div>
                <div className="space-y-2">
                  {entry.questions.map((q, i) => entry.answers[i] && (
                    <div key={i}>
                      <div className="text-[10px] font-bold text-teal-400 mb-0.5">Q{i + 1}: {q.slice(0, 80)}…</div>
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
export function BehavioralMockSession() {
  const [view, setView] = useState<"entry" | "idle" | "running" | "done" | "history">("entry");
  const [round, setRound] = useState(0); // 0, 1, 2
  const [starPhase, setStarPhase] = useState(0); // 0-3 (S/T/A/R)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [running, setRunning] = useState(false);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [scorecard, setScorecard] = useState<XFNScorecardResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [icMode, setIcMode] = useState<"IC6" | "IC7">("IC7"); // Difficulty selector
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick 3 random XFN questions once per session
  const [questions] = useState<typeof XFN_QUESTIONS>(() => {
    const pool = [...XFN_QUESTIONS];
    const picked: typeof XFN_QUESTIONS = [];
    while (picked.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    // Fallback: repeat if fewer than 3 XFN questions exist
    while (picked.length < 3) picked.push(picked[picked.length - 1]);
    return picked;
  });

  const scoreMutation = trpc.ai.xfnMockScorecard.useMutation();
  const upsertSessionMutation = trpc.mockHistory.upsertSession.useMutation();
  const icModeRef = useRef<"IC6" | "IC7">(icMode);
  useEffect(() => { icModeRef.current = icMode; }, [icMode]);

  const currentQ = questions[round];
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const pct = ((ROUND_TIME - timeLeft) / ROUND_TIME) * 100;
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
          toast.info("Time's up for this question!");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setTimeLeft(ROUND_TIME);
  }, [pauseTimer]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const goToNextRound = async () => {
    pauseTimer();
    if (round < 2) {
      setRound((r) => r + 1);
      setTimeLeft(ROUND_TIME);
      setStarPhase(0);
      setShowHint(false);
    } else {
      setView("done");
      try {
        const result = await scoreMutation.mutateAsync({
          rounds: questions.map((q, i) => ({
            question: q.q,
            answer: answers[i],
          })),
          icMode: icModeRef.current,
        });
        setScorecard(result);
        const entry: HistoryEntry = {
          id: `${Date.now()}`,
          date: new Date().toISOString(),
          questions: questions.map((q) => q.q),
          scorecard: result,
          answers,
        };
        const existing = loadHistory();
        saveHistory([...existing, entry]);
        // Persist to DB for cross-device sync
        upsertSessionMutation.mutate({
          sessionType: "xfn",
          sessionId: entry.id,
          sessionData: entry as unknown as Record<string, unknown>,
        });
      } catch {
        toast.error("AI scorecard failed. Please try again.");
      }
    }
  };

  const resetAll = () => {
    pauseTimer();
    setView("entry");
    setRound(0);
    setTimeLeft(ROUND_TIME);
    setRunning(false);
    setAnswers(["", "", ""]);
    setScorecard(null);
    setShowHint(false);
    setStarPhase(0);
    // Keep icMode as-is so user doesn't need to re-select
  };

  const historyCount = loadHistory().length;

  // ── Entry card ──────────────────────────────────────────────────────────────
  if (view === "entry") {
    return (
      <div className="prep-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/30 border border-teal-500/30 flex items-center justify-center text-xl shrink-0">
              🤝
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">XFN Behavioral Mock Session</span>
                <span className="badge badge-teal">~36 min</span>
                <span className="badge badge-blue">AI Scorecard</span>
                {historyCount > 0 && <span className="badge badge-gray">{historyCount} past</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                3 XFN questions × 12 min each — STAR phase hints, timer, and AI evaluation
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {historyCount > 0 && (
              <button onClick={() => setView("history")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all">
                <History size={12} /> History
              </button>
            )}
            <button onClick={() => setView("idle")} className="px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-400 text-sm font-semibold transition-all">
              Start Mock
            </button>
          </div>
        </div>

        {/* IC Level Difficulty Selector */}
        <div className="p-3 rounded-xl border border-border bg-secondary/40">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Rubric Level</div>
          <div className="flex gap-2">
            <button
              onClick={() => setIcMode("IC6")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                icMode === "IC6"
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                  : "bg-secondary border-border text-muted-foreground hover:border-blue-500/30 hover:text-blue-400"
              }`}
            >
              <div className="text-sm mb-0.5">🎯 IC6</div>
              <div className="text-[10px] font-normal opacity-80">Project-level XFN impact</div>
            </button>
            <button
              onClick={() => setIcMode("IC7")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                icMode === "IC7"
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-secondary border-border text-muted-foreground hover:border-violet-500/30 hover:text-violet-400"
              }`}
            >
              <div className="text-sm mb-0.5">🚀 IC7</div>
              <div className="text-[10px] font-normal opacity-80">Org-level strategic influence</div>
            </button>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            {icMode === "IC6"
              ? "IC6 rubric: effective project-level XFN collaboration, clear communication, resolves team-level conflicts"
              : "IC7 rubric: long-term strategic partnerships, proactive org alignment, drives cross-org initiatives, multiplies team impact"}
          </div>
        </div>
      </div>
    );
  }

  // ── History view ────────────────────────────────────────────────────────────
  if (view === "history") {
    return <HistoryPanel onClose={() => setView("entry")} />;
  }

  // ── Idle — confirm ──────────────────────────────────────────────────────────
  if (view === "idle") {
    return (
      <div className="prep-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={14} className="text-teal-400" />
          <span className="text-sm font-bold text-foreground">XFN Behavioral Mock Session</span>
          <span className="badge badge-teal">3 questions · ~36 min</span>
          <span className={`badge ${
            icMode === "IC7" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
          } text-[10px] px-2 py-0.5 rounded-full font-bold`}>{icMode} Mode</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Simulates Meta's XFN Partnership interview round at <strong className={icMode === "IC7" ? "text-violet-400" : "text-blue-400"}>{icMode}</strong> level.
          Answer 3 XFN questions using the STAR framework with a 12-minute timer each.
          {icMode === "IC7" ? " AI rubric evaluates for org-level strategic influence and long-term partnership patterns." : " AI rubric evaluates for effective project-level collaboration and conflict resolution."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {questions.map((q, i) => (
            <div key={i} className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <div className="text-[10px] font-bold text-teal-400 mb-1">Question {i + 1}</div>
              <div className="text-xs text-foreground leading-relaxed line-clamp-3">{q.q}</div>
              <div className="text-[10px] text-muted-foreground mt-1">12 min</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setView("running")} className="px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-all">
            🚀 Start Mock Session
          </button>
          <button onClick={() => setView("entry")} className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-sm font-semibold transition-all">
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
          <span className="text-sm font-bold text-foreground">XFN Mock Complete</span>
          <span className="badge badge-green">Session done</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
            icMode === "IC7" ? "bg-violet-500/20 text-violet-400 border-violet-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"
          }`}>{icMode} Rubric</span>
        </div>

        {scoreMutation.isPending && (
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-center">
            <div className="text-sm text-teal-400 animate-pulse">🤖 AI is evaluating your XFN session…</div>
            <div className="text-xs text-muted-foreground mt-1">This may take 10–20 seconds</div>
          </div>
        )}

        {scorecard && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Overall", score: scorecard.overallScore },
                { label: "Collaboration", score: scorecard.collaborationScore },
                { label: "Conflict Res.", score: scorecard.conflictScore },
                { label: "Alignment", score: scorecard.alignmentScore },
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

        <div className="flex flex-wrap gap-2">
          <button onClick={resetAll} className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-sm font-semibold text-foreground transition-all">
            🔄 Start New Mock
          </button>
          <button onClick={() => setView("history")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-400 text-sm font-semibold transition-all">
            <History size={13} /> View History
          </button>
          {scorecard && (
            <button
              onClick={() => {
                const lines: string[] = [
                  `# XFN Behavioral Mock Transcript`,
                  `**Date:** ${new Date().toLocaleString()}`,
                  `**IC Mode:** ${icMode}`,
                  `**Overall Score:** ${scorecard.overallScore.toFixed(1)}/5  |  **IC Level:** ${scorecard.icLevel}`,
                  ``,
                  `## Scores`,
                  `| Dimension | Score |`,
                  `|---|---|`,
                  `| Collaboration | ${scorecard.collaborationScore.toFixed(1)}/5 |`,
                  `| Conflict Resolution | ${scorecard.conflictScore.toFixed(1)}/5 |`,
                  `| Alignment | ${scorecard.alignmentScore.toFixed(1)}/5 |`,
                  `| Communication | ${scorecard.communicationScore.toFixed(1)}/5 |`,
                  ``,
                  `## AI Summary`,
                  scorecard.summary,
                  ``,
                  `## Strengths`,
                  ...scorecard.strengths.map(s => `- ${s}`),
                  ``,
                  `## Areas to Improve`,
                  ...scorecard.improvements.map(s => `- ${s}`),
                  ``,
                  `## Follow-up Questions`,
                  ...scorecard.followUpQuestions.map((q, i) => `${i + 1}. ${q}`),
                ];
                const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `xfn-mock-${new Date().toISOString().slice(0,10)}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-sm font-semibold transition-all">
              <Download size={13} /> Export .md
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Running ─────────────────────────────────────────────────────────────────
  return (
    <div className="prep-card p-5 space-y-4">
      {/* Round progress */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < round ? "bg-emerald-500" : i === round ? "bg-teal-500" : "bg-secondary"}`} />
        ))}
        <span className="text-xs text-muted-foreground shrink-0">Q {round + 1}/3</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-5">
        {/* Timer ring */}
        <div className="relative w-24 h-24 shrink-0 mx-auto sm:mx-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="oklch(0.28 0.012 264)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={r} fill="none"
              stroke={timeLeft <= 60 ? "oklch(0.65 0.22 25)" : timeLeft <= 120 ? "oklch(0.78 0.18 85)" : "oklch(0.62 0.22 175)"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="mono text-base font-bold text-foreground">{mm}:{ss}</span>
            <span className="text-[9px] text-muted-foreground">12m total</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-teal">Question {round + 1} of 3</span>
            <span className="badge badge-teal">XFN Partnership</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
              icMode === "IC7" ? "bg-violet-500/20 text-violet-400 border-violet-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"
            }`}>{icMode}</span>
          </div>

          <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <div className="text-xs text-teal-400 font-bold mb-1">Interview Question</div>
            <div className="text-sm font-bold text-foreground leading-relaxed">{currentQ.q}</div>
          </div>

          {/* STAR phase tabs */}
          <div className="flex gap-1 flex-wrap">
            {STAR_PHASES.map((p, i) => (
              <button
                key={i}
                onClick={() => setStarPhase(i)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  starPhase === i
                    ? "bg-teal-500/20 border-teal-500/30 text-teal-400"
                    : "bg-secondary border-border text-muted-foreground hover:border-teal-500/30"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div>
            <button onClick={() => setShowHint((h) => !h)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {showHint ? "▲ Hide hint" : "▼ Show STAR hint"}
            </button>
            {showHint && (
              <div className="mt-1.5 p-2.5 rounded-lg bg-secondary text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-teal-400">{STAR_PHASES[starPhase].label}: </span>
                {STAR_PHASES[starPhase].hint}
              </div>
            )}
          </div>

          <textarea
            value={answers[round]}
            onChange={(e) => setAnswers((a) => { const n = [...a]; n[round] = e.target.value; return n; })}
            placeholder={`Write your STAR answer here… (use the S/T/A/R tabs above to guide your structure)`}
            rows={5}
            className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-teal-500/50 resize-none placeholder:text-muted-foreground/50 leading-relaxed"
          />

          <div className="flex gap-2 flex-wrap">
            {!running && (
              <button onClick={startTimer} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-400 text-xs font-semibold transition-all">
                <Play size={11} /> Start Timer
              </button>
            )}
            {running && (
              <button onClick={pauseTimer} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all">
                <Pause size={11} /> Pause
              </button>
            )}
            <button onClick={resetTimer} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all">
              <RotateCcw size={11} /> Reset
            </button>
            <button onClick={goToNextRound} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all ml-auto">
              {round < 2 ? "Next Question →" : "🏁 Finish & Score"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
