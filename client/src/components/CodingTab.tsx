// Design: Bold Engineering Dashboard — Coding Tab
// Features: search, difficulty/freq/mastery filter, quick drill with 30s timer,
// spaced repetition, heatmap, Anki export, weak-spots filter, pattern notes,
// mock interview timer (25/35/45 min), session history
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Download, Flame, Clock, ChevronDown, ChevronUp, Star, Zap, BarChart2, BookOpen, Filter } from "lucide-react";
import { PATTERNS } from "@/lib/data";
import { usePatternRatings, usePatternNotes, useSpacedRepetition, useCodingHistory } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import PatternDependencyGraph from "@/components/PatternDependencyGraph";

const DIFF_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
const DIFF_COLOR: Record<string, string> = { Easy: "badge-green", Medium: "badge-amber", Hard: "badge-red" };

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} className={`star-btn ${(hover || value) >= s ? "active" : ""}`}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => onChange(s)}>★</button>
      ))}
    </div>
  );
}

// ── Pattern Heatmap ────────────────────────────────────────────────────────
function PatternHeatmap({ ratings }: { ratings: Record<string, number> }) {
  const masteredCount = PATTERNS.filter(p => (ratings[p.id] ?? 0) >= 4).length;
  const weakCount = PATTERNS.filter(p => (ratings[p.id] ?? 0) > 0 && (ratings[p.id] ?? 0) <= 2).length;
  const avgRating = PATTERNS.filter(p => ratings[p.id]).length
    ? (PATTERNS.filter(p => ratings[p.id]).reduce((s, p) => s + ratings[p.id], 0) / PATTERNS.filter(p => ratings[p.id]).length).toFixed(1)
    : "—";

  const getColor = (rating: number) => {
    if (!rating) return "bg-secondary";
    if (rating <= 1) return "bg-red-500/70";
    if (rating <= 2) return "bg-orange-500/70";
    if (rating <= 3) return "bg-amber-500/70";
    if (rating <= 4) return "bg-emerald-500/70";
    return "bg-emerald-400/90";
  };

  return (
    <div className="prep-card p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 size={14} className="text-blue-400" />
        <span className="section-title text-sm mb-0 pb-0 border-0">Pattern Mastery Heatmap</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PATTERNS.map(p => {
          const r = ratings[p.id] ?? 0;
          return (
            <div key={p.id} title={`${p.name}: ${r ? `★${r}` : "Not rated"}`}
              className={`w-8 h-8 rounded-md ${getColor(r)} flex items-center justify-center text-xs font-bold text-white/80 cursor-default transition-all hover:scale-110`}>
              {r || ""}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/70 inline-block" />Weak (★1–2)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/70 inline-block" />Learning (★3)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 inline-block" />Strong (★4–5)</span>
        <span className="ml-auto font-medium text-foreground">{masteredCount}/{PATTERNS.length} mastered · {weakCount} weak · avg {avgRating}</span>
      </div>
    </div>
  );
}

// ── Quick Drill ────────────────────────────────────────────────────────────
function QuickDrill({ ratings, onRate, weakOnly }: {
  ratings: Record<string, number>;
  onRate: (id: string, rating: number) => void;
  weakOnly: boolean;
}) {
  const pool = weakOnly
    ? PATTERNS.filter(p => (ratings[p.id] ?? 0) > 0 && (ratings[p.id] ?? 0) <= 2)
    : PATTERNS;
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = pool[idx % Math.max(pool.length, 1)];

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(30);
    setRunning(false);
  }, []);

  const startTimer = useCallback(() => {
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRunning(false);
          setRevealed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const next = () => {
    setIdx(i => (i + 1) % Math.max(pool.length, 1));
    setRevealed(false);
    resetTimer();
  };

  if (pool.length === 0) {
    return (
      <div className="prep-card p-6 text-center text-muted-foreground">
        <p className="text-sm">No {weakOnly ? "weak " : ""}patterns found.</p>
        {weakOnly && <p className="text-xs mt-1">Rate some patterns ★1–2 in the table below to populate weak-spots drill.</p>}
      </div>
    );
  }

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          <span className="text-sm font-semibold text-foreground">Quick Drill</span>
          {weakOnly && <span className="badge badge-red">Weak Spots Only</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`mono text-lg font-bold ${timeLeft <= 10 ? "text-red-400" : "text-amber-400"}`}>{timeLeft}s</span>
          <button onClick={running ? resetTimer : startTimer}
            className="px-3 py-1 rounded-md text-xs font-semibold bg-secondary hover:bg-accent text-foreground transition-all">
            {running ? "Reset" : "Start"}
          </button>
          <button onClick={next} className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all">
            Next →
          </button>
        </div>
      </div>
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-bold text-foreground">{current.name}</span>
          <span className={`badge ${DIFF_COLOR[current.diff]}`}>{current.diff}</span>
          <span className="badge badge-gray">★{current.freq} freq</span>
        </div>
        <p className="text-sm text-muted-foreground">{current.keyIdea}</p>
      </div>
      {!revealed ? (
        <button onClick={() => { setRevealed(true); resetTimer(); }}
          className="w-full py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-blue-500/40 hover:text-blue-400 transition-all">
          Reveal answer
        </button>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-secondary text-sm text-foreground">{current.desc}</div>
          <div className="flex flex-wrap gap-1.5">
            {current.examples.map(e => <span key={e} className="badge badge-blue">{e}</span>)}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Rate this pattern:</span>
            <StarRating value={ratings[current.id] ?? 0} onChange={v => { onRate(current.id, v); next(); }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mock Interview Timer ───────────────────────────────────────────────────
function MockTimer({ onSessionEnd }: { onSessionEnd: (duration: number) => void }) {
  const [duration, setDuration] = useState(35);
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pct = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const urgent = timeLeft <= 60;
  const warning = timeLeft <= 5 * 60;

  const start = () => {
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRunning(false);
          setDone(true);
          onSessionEnd(duration);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const pause = () => { if (timerRef.current) clearInterval(timerRef.current); setRunning(false); };
  const reset = () => { pause(); setTimeLeft(duration * 60); setDone(false); };

  useEffect(() => { reset(); }, [duration]); // eslint-disable-line
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const r = 40;
  const circ = 2 * Math.PI * r;

  return (
    <div className="prep-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} className="text-blue-400" />
        <span className="text-sm font-semibold text-foreground">Mock Interview Timer</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG ring */}
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="oklch(0.28 0.012 264)" strokeWidth="8" />
            <circle cx="50" cy="50" r={r} fill="none"
              stroke={urgent ? "oklch(0.65 0.22 25)" : warning ? "oklch(0.78 0.17 75)" : "oklch(0.62 0.19 258)"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`mono text-lg font-bold ${urgent ? "text-red-400" : warning ? "text-amber-400" : "text-foreground"}`}>
              {mm}:{ss}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {/* Duration selector */}
          <div className="flex gap-2">
            {[25, 35, 45].map(d => (
              <button key={d} onClick={() => { setDuration(d); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${duration === d ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
                {d} min
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {!running && !done && <button onClick={start} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all">Start</button>}
            {running && <button onClick={pause} className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-foreground text-sm font-semibold transition-all">Pause</button>}
            <button onClick={reset} className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-foreground text-sm font-semibold transition-all">Reset</button>
          </div>
          {done && <div className="text-sm font-semibold text-emerald-400">✓ Session complete! Session logged.</div>}
        </div>
      </div>
    </div>
  );
}

// ── Main CodingTab ─────────────────────────────────────────────────────────
export default function CodingTab() {
  const [ratings, setRatings] = usePatternRatings();
  const [notes, setNotes] = usePatternNotes();
  const [srDue, setSrDue] = useSpacedRepetition();
  const [sessions, setSessions] = useCodingHistory();
  const [search, setSearch] = useState("");
  const [filterDiff, setFilterDiff] = useState("All");
  const [filterFreq, setFilterFreq] = useState(0);
  const [filterMastery, setFilterMastery] = useState("All");
  const [weakOnly, setWeakOnly] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [showDrillMode, setShowDrillMode] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const handleRate = (id: string, rating: number) => {
    setRatings(r => ({ ...r, [id]: rating }));
    // Spaced repetition scheduling
    const days = rating <= 2 ? 1 : rating === 3 ? 3 : rating === 4 ? 7 : 14;
    const due = new Date();
    due.setDate(due.getDate() + days);
    setSrDue(d => ({ ...d, [id]: due.toISOString().split("T")[0] }));
  };

  const handleSessionEnd = (duration: number) => {
    setSessions(s => [...s, { id: Date.now().toString(), date: today, duration, type: `${duration}min` as "35min" }]);
    toast.success(`${duration}-min session logged!`);
  };

  const exportAnkiCSV = () => {
    const rows = ["#separator:comma", "#html:false", "#deck:Meta Coding Patterns", "#notetype:Basic"];
    PATTERNS.forEach(p => {
      const front = `${p.name} (${p.diff})`;
      const back = `Key Idea: ${p.keyIdea}\\n\\nDescription: ${p.desc}\\n\\nExamples: ${p.examples.join(", ")}`;
      rows.push(`"${front}","${back}","Meta,Coding,${p.diff}"`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "meta_patterns_anki.csv"; a.click();
    toast.success("Anki CSV exported! Import into Anki or Quizlet.");
  };

  const filtered = PATTERNS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.keyIdea.toLowerCase().includes(q) || p.examples.some(e => e.toLowerCase().includes(q));
    const matchDiff = filterDiff === "All" || p.diff === filterDiff;
    const matchFreq = filterFreq === 0 || p.freq >= filterFreq;
    const r = ratings[p.id] ?? 0;
    const matchMastery = filterMastery === "All" || (filterMastery === "Mastered" && r >= 4) || (filterMastery === "Weak" && r > 0 && r <= 2) || (filterMastery === "Unrated" && r === 0);
    const matchWeak = !weakOnly || (r > 0 && r <= 2);
    return matchSearch && matchDiff && matchFreq && matchMastery && matchWeak;
  });

  const dueToday = PATTERNS.filter(p => srDue[p.id] && srDue[p.id] <= today);

  return (
    <div className="space-y-5">
      {/* Heatmap */}
      {showHeatmap && <PatternHeatmap ratings={ratings} />}

      {/* Controls bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patterns, key ideas, examples…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50" />
        </div>
        {/* Filters */}
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none">
          <option value="All">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select value={filterFreq} onChange={e => setFilterFreq(Number(e.target.value))}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none">
          <option value={0}>All Frequency</option>
          <option value={4}>★4+ freq</option>
          <option value={5}>★5 freq</option>
        </select>
        <select value={filterMastery} onChange={e => setFilterMastery(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none">
          <option value="All">All Mastery</option>
          <option value="Mastered">Mastered (★4–5)</option>
          <option value="Weak">Weak (★1–2)</option>
          <option value="Unrated">Unrated</option>
        </select>
        {/* Weak spots toggle */}
        <button onClick={() => setWeakOnly(w => !w)}
          className={`filter-btn ${weakOnly ? "filter-btn-weak active" : "filter-btn-weak"}`}>
          🎯 Weak Spots {weakOnly ? "ON" : "OFF"}
        </button>
        {/* Due today */}
        {dueToday.length > 0 && (
          <span className="badge badge-amber">{dueToday.length} due today</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setShowDrillMode(d => !d)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-sm font-semibold transition-all">
          <Zap size={13} /> {showDrillMode ? "Hide" : "Show"} Quick Drill
        </button>
        <button onClick={() => setShowHeatmap(h => !h)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-sm font-semibold transition-all">
          <BarChart2 size={13} /> {showHeatmap ? "Hide" : "Show"} Heatmap
        </button>
        <button onClick={exportAnkiCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 text-sm font-semibold transition-all">
          <Download size={13} /> Export Anki CSV
        </button>
      </div>

      {/* Quick Drill */}
      {showDrillMode && <QuickDrill ratings={ratings} onRate={handleRate} weakOnly={weakOnly} />}

      {/* Mock Timer */}
      <MockTimer onSessionEnd={handleSessionEnd} />

      {/* Session history summary */}
      {sessions.length > 0 && (
        <div className="prep-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={13} className="text-blue-400" />
            <span className="text-sm font-semibold text-foreground">Session History</span>
            <span className="badge badge-blue ml-auto">{sessions.length} sessions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sessions.slice(-8).reverse().map(s => (
              <div key={s.id} className="px-2.5 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
                {s.date} · {s.duration}min
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-step approach */}
      <div className="prep-card p-5">
        <div className="section-title">
          <BookOpen size={14} className="text-blue-400" />
          7-Step Problem-Solving Approach
        </div>
        <ol className="space-y-2">
          {[
            ["Clarify", "Ask 2–3 clarifying questions. Confirm input/output format, constraints, edge cases."],
            ["Examples", "Walk through 2 examples (normal + edge case) before touching code."],
            ["Pattern Recognition", "Identify which of the 14 patterns applies. State it aloud."],
            ["Brute Force First", "Describe the O(n²) or naive solution. Explain why it's suboptimal."],
            ["Optimize", "Apply the pattern. Explain time/space complexity before coding."],
            ["Code", "Write clean, readable code. Use meaningful variable names. No magic numbers."],
            ["Test & Edge Cases", "Trace through your code with examples. Check null, empty, single element."],
          ].map(([step, desc], i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <div><span className="font-semibold text-foreground">{step}: </span><span className="text-muted-foreground">{desc}</span></div>
            </li>
          ))}
        </ol>
      </div>

      {/* Pattern table */}
      <div className="prep-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="section-title mb-0 pb-0 border-0">
            <Filter size={14} className="text-blue-400" />
            Pattern Quick Reference
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length}/{PATTERNS.length} shown</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map(p => {
            const r = ratings[p.id] ?? 0;
            const isExpanded = expandedNote === p.id;
            const isDue = srDue[p.id] && srDue[p.id] <= today;
            return (
              <div key={p.id} className={`p-4 transition-all ${r >= 4 ? "bg-emerald-500/3" : r > 0 && r <= 2 ? "bg-red-500/3" : ""}`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-foreground">{p.name}</span>
                      <span className={`badge ${DIFF_COLOR[p.diff]}`}>{p.diff}</span>
                      <span className="badge badge-gray">★{p.freq}</span>
                      {isDue && <span className="badge badge-amber">Due today</span>}
                      {r >= 4 && <span className="badge badge-green">Mastered</span>}
                      {r > 0 && r <= 2 && <span className="badge badge-red">Weak</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">{p.keyIdea}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.examples.map(e => <span key={e} className="badge badge-blue text-xs">{e}</span>)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StarRating value={r} onChange={v => handleRate(p.id, v)} />
                    <button onClick={() => setExpandedNote(isExpanded ? null : p.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <BookOpen size={11} /> Notes {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3">
                    <textarea
                      value={notes[p.id] ?? ""}
                      onChange={e => setNotes(n => ({ ...n, [p.id]: e.target.value }))}
                      placeholder="Add your mnemonic, notes, or key insight…"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No patterns match your filters.</div>
          )}
        </div>
      </div>

      {/* AI-Enabled Round Deep Dive */}
      <AIEnabledRoundSection />

      {/* Pattern Dependency Graph */}
      <PatternDependencyGraph />

      {/* CTCI 500 Question Tracker */}
      <CTCITracker />
    </div>
  );
}

// ── AI-Enabled Round Section ───────────────────────────────────────────────
function AIEnabledRoundSection() {
  const [open, setOpen] = useState(false);

  const checkpoints = [
    { label: "Checkpoint 1", desc: "Understand the codebase structure, identify entry points, and clarify requirements. Often done without AI." },
    { label: "Checkpoint 2", desc: "Implement core logic — the primary function or module. Use AI for boilerplate; you own the algorithm." },
    { label: "Checkpoint 3", desc: "Add edge-case handling, input validation, and error paths. Run tests and fix failures." },
    { label: "Checkpoint 4", desc: "Extend or refactor — add a new feature, optimize a hot path, or improve code quality. Discuss trade-offs." },
    { label: "Checkpoint 5+", desc: "Bonus: runtime analysis, contract changes, data reasoning, or a second extension. Differentiates IC6 from IC7." },
  ];

  const evalCriteria = [
    { icon: "🧠", title: "Problem Solving", desc: "Clarify and refine problem statements. Generate solutions to open-ended and quantitative problems." },
    { icon: "💻", title: "Code Development", desc: "Navigate a codebase, build on working structures, evaluate code quality, and ensure code works as intended after execution." },
    { icon: "🔍", title: "Verification & Debugging", desc: "Find and mitigate errors. Verify solutions meet specified requirements. Run code iteratively." },
    { icon: "🗣️", title: "Technical Communication", desc: "Communicate reasoning, discuss technical ideas, ask thoughtful questions, and incorporate feedback." },
  ];

  const aiTips = [
    ["Use AI for boilerplate", "Let the AI scaffold classes, write repetitive loops, and generate test stubs. You focus on the algorithm and design decisions."],
    ["Be precise with prompts", "Ask for a specific function or small slice of logic — not the entire solution. Vague prompts produce hallucinated code."],
    ["Always review AI output", "AI can suggest suboptimal algorithms, miss constraints, or introduce subtle bugs. Treat every suggestion as a draft to verify."],
    ["Pipeline your work", "While AI drafts one section, you review or explain the previous section to the interviewer. Never wait idle."],
    ["First checkpoint without AI", "Some interviewers ask you to complete checkpoint 1 unaided. Be ready to code fluently from scratch."],
    ["Know your model", "GPT-4o mini, Claude 3.5 Haiku, and Llama 4 Maverick are confirmed available. Each has different latency and hallucination patterns — practice with them before your interview."],
  ];

  const models = [
    { name: "GPT-4o mini", status: "confirmed", note: "Fast, good at Python/JS boilerplate" },
    { name: "Claude 3.5 Haiku", status: "confirmed", note: "Strong at following precise instructions" },
    { name: "Llama 4 Maverick", status: "confirmed", note: "Meta's own model — expect it in most rounds" },
    { name: "GPT-5", status: "unconfirmed", note: "Supported by CoderPad, not yet confirmed" },
    { name: "Gemini 2.5 Pro", status: "unconfirmed", note: "Supported by CoderPad, not yet confirmed" },
    { name: "Claude 4 Sonnet", status: "unconfirmed", note: "Supported by CoderPad, not yet confirmed" },
  ];

  return (
    <div className="prep-card p-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div className="text-left">
            <div className="text-sm font-bold text-foreground">Meta AI-Enabled Coding Round</div>
            <div className="text-xs text-muted-foreground">New format since Oct 2025 · CoderPad + AI assistant · 60 min · 4–5 checkpoints</div>
          </div>
          <span className="badge badge-blue ml-2">NEW</span>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-5 space-y-5">
          {/* Format overview */}
          <div className="callout callout-blue p-4">
            <div className="text-xs font-bold text-blue-400 mb-2">FORMAT OVERVIEW</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                ["60 min", "Total time"],
                ["CoderPad", "Environment"],
                ["4+ checkpoints", "Target to clear"],
                ["1 question", "Multi-part theme"],
              ].map(([val, lbl]) => (
                <div key={lbl}>
                  <div className="text-base font-bold text-blue-300">{val}</div>
                  <div className="text-xs text-muted-foreground">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Key insight */}
          <div className="callout callout-amber p-3">
            <div className="text-xs font-bold text-amber-400 mb-1">⚡ KEY INSIGHT</div>
            <p className="text-xs text-muted-foreground">
              This is <strong className="text-foreground">not an interview about how well you use AI</strong>. The AI is a tool to help you demonstrate coding skills more efficiently. You are evaluated on problem-solving, code quality, and verification — not prompt engineering. Clearing <strong className="text-foreground">at least 4 checkpoints</strong> is the target; 3 is the minimum threshold but not a guarantee.
            </p>
          </div>

          {/* Checkpoints */}
          <div>
            <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Typical Checkpoint Progression</div>
            <div className="space-y-2">
              {checkpoints.map((cp, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    i < 3 ? "bg-emerald-500/20 text-emerald-400" : i === 3 ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                  }`}>{i + 1}</div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{cp.label}</div>
                    <div className="text-xs text-muted-foreground">{cp.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation criteria */}
          <div>
            <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">What Interviewers Evaluate</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {evalCriteria.map(c => (
                <div key={c.title} className="p-3 rounded-lg bg-secondary">
                  <div className="text-xs font-bold text-foreground mb-1">{c.icon} {c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI models */}
          <div>
            <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Available AI Models</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {models.map(m => (
                <div key={m.name} className="p-2.5 rounded-lg bg-secondary flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${m.status === "confirmed" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <div>
                    <div className="text-xs font-semibold text-foreground">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.note}</div>
                    <div className={`text-xs mt-0.5 ${m.status === "confirmed" ? "text-emerald-400" : "text-amber-400"}`}>
                      {m.status === "confirmed" ? "✓ Confirmed" : "~ Unconfirmed"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI tips */}
          <div>
            <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">How to Use AI Effectively</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aiTips.map(([title, desc]) => (
                <div key={title} className="callout callout-blue p-3">
                  <div className="text-xs font-bold text-blue-400 mb-1">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Highest-leverage moves */}
          <div className="callout callout-green p-4">
            <div className="text-xs font-bold text-emerald-400 mb-2">✅ YOUR HIGHEST-LEVERAGE MOVES</div>
            <ol className="space-y-1">
              {[
                "Build a requirements checklist before touching code",
                "Write tests first (or understand pre-written tests if provided)",
                "Generate a skeleton before implementing logic",
                "Pipeline your work: while AI drafts, you review or explain to interviewer",
                "Run and debug in small iterations — fix one thing at a time",
                "Be ready for non-coding discussion: runtime analysis, trade-offs, data reasoning",
              ].map((m, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                  {m}
                </li>
              ))}
            </ol>
          </div>

          {/* Languages + unit test frameworks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { lang: "Python", test: "unittest" },
              { lang: "Java", test: "JUnit" },
              { lang: "C++", test: "GoogleTest" },
              { lang: "C# / TypeScript", test: "NUnit / Jest" },
            ].map(l => (
              <div key={l.lang} className="p-2.5 rounded-lg bg-secondary text-center">
                <div className="text-xs font-bold text-foreground">{l.lang}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{l.test}</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Source: <a href="https://www.coditioning.com/blog/13/meta-ai-enabled-coding-interview-guide" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Coditioning — Meta AI-Enabled Coding Interview Guide</a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CTCI 500 Question Tracker ──────────────────────────────────────────────
import { CTCI_QUESTIONS, CTCI_ALL_TOPICS } from "@/lib/ctciData";

const PAGE_SIZE = 25;

function CTCITracker() {
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [freqFilter, setFreqFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [solved, setSolved] = useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("ctci_solved") ?? "{}"); } catch { return {}; }
  });
  const [open, setOpen] = useState(false);

  const toggle = (num: number) => {
    setSolved(s => {
      const next = { ...s, [num]: !s[num] };
      localStorage.setItem("ctci_solved", JSON.stringify(next));
      return next;
    });
  };

  const filtered = CTCI_QUESTIONS.filter(q => {
    if (diffFilter !== "All" && q.difficulty !== diffFilter) return false;
    if (topicFilter !== "All" && !q.topics.includes(topicFilter)) return false;
    if (freqFilter !== "All" && q.metaFreq !== freqFilter) return false;
    if (search && !q.name.toLowerCase().includes(search.toLowerCase()) && !q.topics.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const solvedCount = Object.values(solved).filter(Boolean).length;
  const highFreqSolved = CTCI_QUESTIONS.filter(q => q.metaFreq === "High" && solved[q.num]).length;
  const highFreqTotal = CTCI_QUESTIONS.filter(q => q.metaFreq === "High").length;

  return (
    <div className="prep-card p-5">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-purple-400" />
          <div className="text-left">
            <div className="text-sm font-bold text-foreground">Crack The Coding Interview — Dinesh Varyani</div>
            <div className="text-xs text-muted-foreground">500 curated LeetCode problems · Meta Frequency tags · {solvedCount}/500 solved</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-purple-400">{Math.round((solvedCount / 500) * 100)}%</div>
          {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-secondary text-center">
              <div className="text-base font-bold text-foreground">{solvedCount}</div>
              <div className="text-xs text-muted-foreground">Total Solved</div>
            </div>
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
              <div className="text-base font-bold text-red-400">{highFreqSolved}/{highFreqTotal}</div>
              <div className="text-xs text-muted-foreground">🔥 High Freq Solved</div>
            </div>
            <div className="p-2.5 rounded-lg bg-secondary text-center">
              <div className="text-base font-bold text-foreground">{500 - solvedCount}</div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Overall progress</span>
              <span>{Math.round((solvedCount / 500) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${(solvedCount / 500) * 100}%` }} />
            </div>
          </div>

          {/* High-freq progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>🔥 High Meta Frequency ({highFreqTotal} problems)</span>
              <span>{Math.round((highFreqSolved / highFreqTotal) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${(highFreqSolved / highFreqTotal) * 100}%` }} />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-36">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search problems or topics…"
                className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50" />
            </div>
            <select value={freqFilter} onChange={e => handleFilterChange(setFreqFilter)(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none">
              <option value="All">All Freq</option>
              <option value="High">🔥 High (Meta)</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">Low</option>
            </select>
            <select value={diffFilter} onChange={e => handleFilterChange(setDiffFilter)(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none">
              <option>All</option><option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
            <select value={topicFilter} onChange={e => handleFilterChange(setTopicFilter)(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none max-w-36">
              <option>All</option>
              {CTCI_ALL_TOPICS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Results count */}
          <div className="text-xs text-muted-foreground">
            Showing {paginated.length} of {filtered.length} problems
            {filtered.length < 500 && <span className="ml-1">(filtered from 500)</span>}
          </div>

          {/* Question list */}
          <div className="space-y-1">
            {paginated.map(q => (
              <div key={q.num}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                  solved[q.num] ? "bg-purple-500/10 border border-purple-500/20" : "bg-secondary hover:bg-accent"
                }`}>
                <input type="checkbox" checked={!!solved[q.num]} onChange={() => toggle(q.num)}
                  className="w-3.5 h-3.5 accent-purple-500 shrink-0 cursor-pointer" />
                <span className="text-xs text-muted-foreground w-7 shrink-0 font-mono">{q.num}.</span>
                <a href={q.url} target="_blank" rel="noopener noreferrer"
                  className={`text-xs font-medium flex-1 hover:underline ${
                    solved[q.num] ? "line-through text-muted-foreground" : "text-foreground"
                  }`}>{q.name}</a>
                <div className="flex gap-1 flex-wrap justify-end items-center">
                  {q.metaFreq === "High" && (
                    <span className="badge badge-red text-xs">🔥 Meta</span>
                  )}
                  {q.metaFreq === "Medium" && (
                    <span className="badge badge-amber text-xs">⚡ Meta</span>
                  )}
                  {q.topics.slice(0, 1).map(t => (
                    <span key={t} className="badge badge-gray text-xs hidden sm:inline">{t}</span>
                  ))}
                  <span className={`badge ${
                    q.difficulty === "Easy" ? "badge-green" : q.difficulty === "Hard" ? "badge-red" : "badge-amber"
                  }`}>{q.difficulty}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-xs">No problems match your filters.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground disabled:opacity-40 hover:bg-accent transition-colors"
              >← Prev</button>
              <div className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {filtered.length} problems
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground disabled:opacity-40 hover:bg-accent transition-colors"
              >Next →</button>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            🔥 High = frequently reported in Meta coding rounds (community data) ·{" "}
            <a href="https://docs.google.com/spreadsheets/d/1pnI8HmSMPcfwrCCu7wYETCXaKDig4VucZDpcjVRuYrE/edit" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Full Spreadsheet</a>
            {" · "}
            <a href="https://www.youtube.com/user/hubberspot" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">YouTube</a>
          </div>
        </div>
      )}
    </div>
  );
}
