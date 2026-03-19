// CodingMockSession — 45-min coding mock with pattern picker, timed phases, and AI scorecard
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { PATTERNS } from "@/lib/data";
import { ChevronDown, ChevronUp, History, Trash2, Timer, Play, Pause, RotateCcw, Shuffle } from "lucide-react";
import Editor from "@monaco-editor/react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Pattern = typeof PATTERNS[number];

type ScorecardResult = {
  overallScore: number;
  correctnessScore: number;
  complexityScore: number;
  codeQualityScore: number;
  communicationScore: number;
  icLevel: string;
  strengths: string[];
  improvements: string[];
  optimalSolutionHint: string;
  followUpQuestions: string[];
  summary: string;
};

type HistoryEntry = {
  id: string;
  date: string;
  patternName: string;
  problemTitle: string;
  difficulty: string;
  scorecard: ScorecardResult;
};

// ── Phases ────────────────────────────────────────────────────────────────────
const CODING_PHASES = [
  {
    phase: "Problem Understanding",
    time: 5 * 60,
    hint: "Read the problem carefully. Clarify constraints: input size, edge cases, expected output format. Ask: 'Can I assume sorted input?' 'What if the array is empty?' 'Is there a space constraint?'",
    prompt: "Restate the problem in your own words. List all constraints and clarifications you'd ask the interviewer.",
  },
  {
    phase: "Approach & Intuition",
    time: 10 * 60,
    hint: "Think out loud. Start with brute force, then optimize. Identify the pattern: sliding window? DP? BFS? Explain WHY this pattern fits. Draw examples on paper.",
    prompt: "Describe your approach. Why does this pattern apply? What's the brute force? What's the optimal approach and why?",
  },
  {
    phase: "Pseudocode / Solution",
    time: 20 * 60,
    hint: "Write clean pseudocode or actual code. Use meaningful variable names. Handle edge cases inline. Talk through each step as you write — interviewers value communication as much as correctness.",
    prompt: "Write your pseudocode or full solution here. Include comments for non-obvious steps.",
  },
  {
    phase: "Complexity Analysis",
    time: 5 * 60,
    hint: "State Time and Space complexity. Be precise: O(n log n) not just 'fast'. Explain WHY: 'Each element is processed once → O(n)'. Consider best/average/worst cases.",
    prompt: "State the Time complexity and Space complexity. Explain your reasoning for each.",
  },
  {
    phase: "Edge Cases & Follow-up",
    time: 5 * 60,
    hint: "List edge cases: empty input, single element, all duplicates, negative numbers, overflow. Then address the follow-up: 'How would you optimize if memory was constrained?' or 'What if the array was sorted?'",
    prompt: "List 3+ edge cases. Then describe how you'd optimize or extend the solution for a follow-up constraint.",
  },
];

// ── localStorage ──────────────────────────────────────────────────────────────
const HISTORY_KEY = "coding_mock_history_v1";
function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}
function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-20)));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-blue-400" : s >= 2 ? "text-amber-400" : "text-red-400";

const diffColor = (delta: number) =>
  delta > 0.2 ? "text-emerald-400" : delta < -0.2 ? "text-red-400" : "text-muted-foreground";

const CODING_DIMS = [
  { key: "overallScore" as const, label: "Overall" },
  { key: "correctnessScore" as const, label: "Correctness" },
  { key: "complexityScore" as const, label: "Complexity" },
  { key: "codeQualityScore" as const, label: "Code Quality" },
  { key: "communicationScore" as const, label: "Communication" },
];

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── History Panel ─────────────────────────────────────────────────────────────
function CodingHistoryPanel({ onClose }: { onClose: () => void }) {
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
            <History size={14} className="text-blue-400" />
            <span className="text-sm font-bold text-foreground">Coding Mock History</span>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">✕ Close</button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-3xl mb-2">💻</div>
          <div className="text-sm">No completed sessions yet.</div>
          <div className="text-xs mt-1">Complete a coding mock to see your history here.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="prep-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={14} className="text-blue-400" />
          <span className="text-sm font-bold text-foreground">Coding Mock History</span>
          <span className="badge badge-blue">{entries.length} session{entries.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          {entries.length >= 2 && (
            <button
              onClick={() => { setCompareMode(!compareMode); setCompareA(null); setCompareB(null); }}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                compareMode
                  ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                  : "bg-secondary border-border text-muted-foreground hover:border-blue-500/30"
              }`}
            >
              {compareMode ? "✕ Cancel Compare" : "⇄ Compare"}
            </button>
          )}
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">✕ Close</button>
        </div>
      </div>

      {compareMode && entryA && entryB && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
          <div className="text-xs font-bold text-blue-400">⇄ Coding Session Comparison</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="text-[10px] text-muted-foreground font-semibold">Session A</div>
            <div className="text-[10px] text-muted-foreground font-semibold">Dimension</div>
            <div className="text-[10px] text-muted-foreground font-semibold">Session B</div>
          </div>
          {CODING_DIMS.map(({ key, label }) => {
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
              <div className="text-xs font-bold text-foreground truncate">{entryA.patternName}</div>
              <div className="text-[10px] text-muted-foreground">{new Date(entryA.date).toLocaleDateString()} · {entryA.scorecard.icLevel}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary">
              <div className="text-[10px] text-muted-foreground">Session B</div>
              <div className="text-xs font-bold text-foreground truncate">{entryB.patternName}</div>
              <div className="text-[10px] text-muted-foreground">{new Date(entryB.date).toLocaleDateString()} · {entryB.scorecard.icLevel}</div>
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
              ? "border-blue-500/50"
              : "border-border"
          }`}>
            <div className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground truncate">{entry.patternName} — {entry.problemTitle}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`badge ${entry.difficulty === "Hard" ? "badge-red" : entry.difficulty === "Easy" ? "badge-green" : "badge-blue"}`}>{entry.difficulty}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</span>
                  <span className={`text-xs font-bold ${scoreColor(entry.scorecard.overallScore)}`}>{entry.scorecard.overallScore.toFixed(1)}/5</span>
                  <span className={`text-xs font-bold ${entry.scorecard.icLevel === "IC7" ? "text-violet-400" : entry.scorecard.icLevel === "IC6" ? "text-blue-400" : "text-muted-foreground"}`}>{entry.scorecard.icLevel}</span>
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
                      compareA === entry.id ? "bg-blue-500/20 border-blue-500/40 text-blue-400" :
                      compareB === entry.id ? "bg-violet-500/20 border-violet-500/40 text-violet-400" :
                      "bg-secondary border-border text-muted-foreground hover:border-blue-500/30"
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
                  {CODING_DIMS.map(({ key, label }) => (
                    <div key={key} className="text-center">
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                      <div className={`text-base font-black ${scoreColor(entry.scorecard[key])}`}>{entry.scorecard[key].toFixed(1)}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{entry.scorecard.summary}</div>
                {entry.scorecard.optimalSolutionHint && (
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="text-[10px] font-bold text-blue-400 mb-1">💡 Optimal Hint</div>
                    <div className="text-xs text-foreground">{entry.scorecard.optimalSolutionHint}</div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-emerald-400 mb-1">Strengths</div>
                    <ul className="space-y-1">{entry.scorecard.strengths.map((s, i) => <li key={i} className="text-[11px] text-foreground flex gap-1.5"><span className="text-emerald-400 shrink-0">✓</span>{s}</li>)}</ul>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-amber-400 mb-1">Improvements</div>
                    <ul className="space-y-1">{entry.scorecard.improvements.map((s, i) => <li key={i} className="text-[11px] text-foreground flex gap-1.5"><span className="text-amber-400 shrink-0">→</span>{s}</li>)}</ul>
                  </div>
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
export function CodingMockSession() {
  const [view, setView] = useState<"entry" | "picker" | "running" | "done" | "history">("entry");
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [problemTitle, setProblemTitle] = useState("");
  const [diffFilter, setDiffFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(CODING_PHASES[0].time);
  const [running, setRunning] = useState(false);
  const [answers, setAnswers] = useState<string[]>(Array(CODING_PHASES.length).fill(""));
  const [scorecard, setScorecard] = useState<ScorecardResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [icMode, setIcMode] = useState<"IC6" | "IC7">("IC6");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyCount = loadHistory().length;

  const scoreMutation = trpc.ai.codingMockScorecard.useMutation();
  const upsertSessionMutation = trpc.mockHistory.upsertSession.useMutation();

  const filteredPatterns = PATTERNS.filter(p =>
    diffFilter === "All" || p.diff === diffFilter
  );

  const phase = CODING_PHASES[step];
  const totalTime = CODING_PHASES.reduce((s, p) => s + p.time, 0);
  const elapsed = CODING_PHASES.slice(0, step).reduce((s, p) => s + p.time, 0) + (phase.time - timeLeft);
  const totalPct = Math.round((elapsed / totalTime) * 100);
  const phasePct = Math.round(((phase.time - timeLeft) / phase.time) * 100);
  const timerColor = timeLeft > phase.time * 0.4 ? "text-blue-400" : timeLeft > 60 ? "text-amber-400" : "text-red-400";
  const ringColor = timeLeft > phase.time * 0.4 ? "stroke-blue-400" : timeLeft > 60 ? "stroke-amber-400" : "stroke-red-400";

  useEffect(() => {
    if (running && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, timeLeft]);

  const pickRandom = () => {
    const pool = filteredPatterns;
    const p = pool[Math.floor(Math.random() * pool.length)];
    setSelectedPattern(p);
    setProblemTitle(p.examples[Math.floor(Math.random() * p.examples.length)]);
  };

  const startSession = () => {
    if (!selectedPattern) return;
    setStep(0);
    setTimeLeft(CODING_PHASES[0].time);
    setAnswers(Array(CODING_PHASES.length).fill(""));
    setScorecard(null);
    setRunning(true);
    setShowHint(false);
    setView("running");
  };

  const nextPhase = () => {
    if (step < CODING_PHASES.length - 1) {
      const next = step + 1;
      setStep(next);
      setTimeLeft(CODING_PHASES[next].time);
      setShowHint(false);
    }
  };

  const finishSession = async () => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setView("done");
    if (!selectedPattern) return;
    try {
      const result = await scoreMutation.mutateAsync({
        patternName: selectedPattern.name,
        problemTitle,
        difficulty: selectedPattern.diff,
        approach: answers[1] || "",
        pseudocode: answers[2] || "",
        complexity: answers[3] || "",
        edgeCases: answers[4] || "",
        followUp: answers[4] || "",
        icMode,
      });
      setScorecard(result);
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        patternName: selectedPattern.name,
        problemTitle,
        difficulty: selectedPattern.diff,
        scorecard: result,
      };
      const existing = loadHistory();
      saveHistory([...existing, entry]);
      // Persist to DB for cross-device sync
      upsertSessionMutation.mutate({
        sessionType: "coding",
        sessionId: entry.id,
        sessionData: entry as unknown as Record<string, unknown>,
      });
    } catch {
      // scorecard stays null
    }
  };

  // ── Entry card ──
  if (view === "entry") {
    return (
      <div className="prep-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💻</span>
            <div>
              <div className="text-sm font-bold text-foreground">Coding Mock Session</div>
              <div className="text-xs text-muted-foreground">45-min · 5 phases · AI scorecard</div>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <History size={13} />
            History{historyCount > 0 && <span className="badge badge-blue ml-1">{historyCount}</span>}
          </button>
        </div>

        {showHistory ? (
          <CodingHistoryPanel onClose={() => setShowHistory(false)} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Phases", value: "5", color: "text-blue-400" },
                { label: "Total Time", value: "45 min", color: "text-violet-400" },
                { label: "AI Feedback", value: "Yes", color: "text-emerald-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-2 rounded-lg bg-secondary">
                  <div className={`text-sm font-bold ${color}`}>{value}</div>
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
            {/* IC6 / IC7 difficulty toggle */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Difficulty Level</div>
              <div className="grid grid-cols-2 gap-2">
                {(["IC6", "IC7"] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setIcMode(level)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      icMode === level
                        ? level === "IC7"
                          ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                          : "bg-blue-500/20 border-blue-500/40 text-blue-400"
                        : "bg-secondary border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {level === "IC6" ? "IC6 — Staff" : "IC7 — Sr. Staff"}
                    {icMode === level && <span className="ml-1.5 text-[9px] opacity-70">{level === "IC7" ? "(stricter)" : "(standard)"}</span>}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {icMode === "IC7"
                  ? "IC7: optimal complexity required, ≥4 edge cases, unprompted follow-ups."
                  : "IC6: clean correct solution, 2–3 edge cases, clear communication."}
              </div>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              Pick a pattern, choose a problem, and work through 5 timed phases: Problem Understanding → Approach → Pseudocode → Complexity → Edge Cases. Finish to get an AI scorecard with IC-level signal.
            </div>
            <button
              onClick={() => setView("picker")}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                icMode === "IC7"
                  ? "bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30"
                  : "bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
              }`}
            >
              🎯 Start {icMode} Mock Session
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Pattern Picker ──
  if (view === "picker") {
    return (
      <div className="prep-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-foreground">Pick a Pattern</div>
          <button onClick={() => setView("entry")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-2 flex-wrap">
          {(["All", "Easy", "Medium", "Hard"] as const).map(d => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                diffFilter === d
                  ? d === "Hard" ? "bg-red-500/20 border-red-500/30 text-red-400"
                    : d === "Easy" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    : d === "Medium" ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                    : "bg-blue-500/20 border-blue-500/30 text-blue-400"
                  : "bg-secondary border-border text-muted-foreground hover:border-border"
              }`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={pickRandom}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-secondary border-border text-muted-foreground hover:text-foreground transition-all"
          >
            <Shuffle size={11} /> Random
          </button>
        </div>

        {/* Pattern grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {filteredPatterns.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPattern(p);
                setProblemTitle(p.examples[0]);
              }}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedPattern?.id === p.id
                  ? "bg-blue-500/15 border-blue-500/40"
                  : "bg-secondary border-border hover:border-blue-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-bold text-foreground">{p.name}</div>
                <span className={`badge ${p.diff === "Hard" ? "badge-red" : p.diff === "Easy" ? "badge-green" : "badge-blue"}`}>{p.diff}</span>
              </div>
              <div className="text-[10px] text-muted-foreground leading-relaxed">{p.keyIdea}</div>
            </button>
          ))}
        </div>

        {/* Problem title input */}
        {selectedPattern && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground">Problem Title</div>
            <div className="flex gap-2 flex-wrap">
              {selectedPattern.examples.map(ex => (
                <button
                  key={ex}
                  onClick={() => setProblemTitle(ex)}
                  className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                    problemTitle === ex
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                      : "bg-secondary border-border text-muted-foreground hover:border-blue-500/30"
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
            <input
              value={problemTitle}
              onChange={e => setProblemTitle(e.target.value)}
              placeholder="Or type a custom problem..."
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
            />
          </div>
        )}

        <button
          onClick={startSession}
          disabled={!selectedPattern || !problemTitle.trim()}
          className="w-full py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-bold hover:bg-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ▶ Start Session — {selectedPattern?.name ?? "Pick a pattern"}
        </button>
      </div>
    );
  }

  // ── Running ──
  if (view === "running") {
    const circumference = 2 * Math.PI * 28;
    const strokeDashoffset = circumference * (1 - phasePct / 100);

    return (
      <div className="prep-card p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-blue-400">{selectedPattern?.name}</div>
            <div className="text-sm font-bold text-foreground truncate">{problemTitle}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${selectedPattern?.diff === "Hard" ? "badge-red" : selectedPattern?.diff === "Easy" ? "badge-green" : "badge-blue"}`}>{selectedPattern?.diff}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              icMode === "IC7"
                ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                : "bg-blue-500/20 border-blue-500/40 text-blue-400"
            }`}>{icMode}</span>
            <button onClick={() => { setRunning(false); setView("entry"); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">✕ Exit</button>
          </div>
        </div>

        {/* Overall progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Phase {step + 1} of {CODING_PHASES.length}</span>
            <span>{totalPct}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${totalPct}%` }} />
          </div>
        </div>

        {/* Phase tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {CODING_PHASES.map((p, i) => (
            <button
              key={i}
              onClick={() => { setStep(i); setTimeLeft(CODING_PHASES[i].time); setShowHint(false); }}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                i === step
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                  : i < step
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-secondary border-border text-muted-foreground"
              }`}
            >
              {p.phase.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Timer + phase info */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-secondary" />
              <circle
                cx="36" cy="36" r="28" fill="none" strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all ${ringColor}`}
              />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-sm font-black ${timerColor}`}>
              {fmtTime(timeLeft)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-foreground mb-0.5">{phase.phase}</div>
            <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{phase.prompt}</div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setRunning(r => !r)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                {running ? <Pause size={11} /> : <Play size={11} />}
                {running ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => setShowHint(h => !h)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                💡 {showHint ? "Hide" : "Hint"}
              </button>
            </div>
          </div>
        </div>

        {/* Hint */}
        {showHint && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
            {phase.hint}
          </div>
        )}

        {/* Answer area — Monaco for pseudocode phase, textarea for others */}
        {step === 2 ? (
          <div className="rounded-lg overflow-hidden border border-blue-500/30">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] border-b border-slate-700/50">
              <span className="text-xs text-muted-foreground">Language:</span>
              <span className="text-xs font-semibold text-blue-400">Python</span>
              <span className="text-xs text-muted-foreground ml-auto">Monaco Editor</span>
            </div>
            <Editor
              height="220px"
              defaultLanguage="python"
              theme="vs-dark"
              value={answers[step]}
              onChange={v => setAnswers(a => { const n = [...a]; n[step] = v ?? ""; return n; })}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                lineNumbers: "on",
                folding: false,
                automaticLayout: true,
              }}
            />
          </div>
        ) : (
          <textarea
            value={answers[step]}
            onChange={e => setAnswers(a => { const n = [...a]; n[step] = e.target.value; return n; })}
            placeholder={phase.prompt}
            rows={8}
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none font-mono leading-relaxed"
          />
        )}

        {/* Navigation */}
        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => { setStep(s => s - 1); setTimeLeft(CODING_PHASES[step - 1].time); setShowHint(false); }}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
            >
              ← Prev
            </button>
          )}
          {step < CODING_PHASES.length - 1 ? (
            <button
              onClick={nextPhase}
              className="flex-1 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/30 transition-all"
            >
              Next Phase →
            </button>
          ) : (
            <button
              onClick={finishSession}
              className="flex-1 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-all"
            >
              ✅ Finish & Score
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Done / Scorecard ──
  if (view === "done") {
    return (
      <div className="prep-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-foreground">Coding Mock — Results</div>
          <button onClick={() => setView("entry")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← New Session</button>
        </div>

        {scoreMutation.isPending && (
          <div className="text-center py-8">
            <div className="text-2xl mb-2 animate-bounce">🤖</div>
            <div className="text-sm text-muted-foreground">AI is evaluating your session…</div>
            <div className="text-xs text-muted-foreground mt-1">This takes 10–20 seconds</div>
          </div>
        )}

        {scoreMutation.isError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            Failed to generate scorecard. Your answers have been saved.
          </div>
        )}

        {scorecard && (
          <div className="space-y-4">
            {/* Score grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {CODING_DIMS.map(({ key, label }) => (
                <div key={key} className="text-center p-2 rounded-lg bg-secondary">
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                  <div className={`text-xl font-black ${scoreColor(scorecard[key])}`}>{scorecard[key].toFixed(1)}</div>
                </div>
              ))}
            </div>

            {/* IC level */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border">
              <div className="text-xs text-muted-foreground">IC Level Signal</div>
              <div className={`text-lg font-black ${scorecard.icLevel === "IC7" ? "text-violet-400" : scorecard.icLevel === "IC6" ? "text-blue-400" : "text-muted-foreground"}`}>
                {scorecard.icLevel}
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground leading-relaxed">{scorecard.summary}</div>

            {/* Optimal hint */}
            {scorecard.optimalSolutionHint && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-[10px] font-bold text-blue-400 mb-1">💡 Optimal Solution Hint</div>
                <div className="text-xs text-foreground leading-relaxed">{scorecard.optimalSolutionHint}</div>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] font-bold text-emerald-400 mb-2">✓ Strengths</div>
                <ul className="space-y-1.5">{scorecard.strengths.map((s, i) => <li key={i} className="text-xs text-foreground leading-relaxed flex gap-1.5"><span className="text-emerald-400 shrink-0">•</span>{s}</li>)}</ul>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-[10px] font-bold text-amber-400 mb-2">→ Improvements</div>
                <ul className="space-y-1.5">{scorecard.improvements.map((s, i) => <li key={i} className="text-xs text-foreground leading-relaxed flex gap-1.5"><span className="text-amber-400 shrink-0">•</span>{s}</li>)}</ul>
              </div>
            </div>

            {/* Follow-up questions */}
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="text-[10px] font-bold text-violet-400 mb-2">🎤 Follow-up Questions</div>
              <ul className="space-y-2">{scorecard.followUpQuestions.map((q, i) => <li key={i} className="text-xs text-foreground leading-relaxed flex gap-1.5"><span className="text-violet-400 shrink-0">{i + 1}.</span>{q}</li>)}</ul>
            </div>

            <button
              onClick={() => setView("entry")}
              className="w-full py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-bold hover:bg-blue-500/30 transition-all"
            >
              🔄 Start New Session
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
