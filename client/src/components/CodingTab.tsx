// Design: Bold Engineering Dashboard — Coding Tab
// Features: search, difficulty/freq/mastery filter, quick drill with 30s timer,
// spaced repetition, heatmap, Anki export, weak-spots filter, pattern notes,
// mock interview timer (25/35/45 min), session history
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Download, Flame, Clock, ChevronDown, ChevronUp, Star, Zap, BarChart2, BookOpen, Filter } from "lucide-react";
import { PATTERNS } from "@/lib/data";
import { usePatternRatings, usePatternNotes, useSpacedRepetition, useCodingHistory } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

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

      {/* Meta-specific tips */}
      <div className="prep-card p-5">
        <div className="section-title">
          <Star size={14} className="text-amber-400" />
          Meta-Specific Coding Tips
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ["AI-Enabled Round", "One coding round now uses CoderPad with AI assistant. Use it to check syntax, not to generate solutions. Interviewers evaluate your thought process, not the AI's."],
            ["Speed Matters", "Meta expects medium problems solved in 20–25 min. Hard problems in 35 min. Practice under time pressure from week 3 onward."],
            ["Clean Code", "Use meaningful variable names. No single-letter variables except loop counters. Add a brief comment for non-obvious logic."],
            ["Complexity First", "Always state time and space complexity before starting to code. If you can't, rethink your approach."],
            ["Edge Cases", "Meta interviewers specifically probe edge cases. Always check: empty input, single element, duplicates, negative numbers, overflow."],
            ["NeetCode 150", "Prioritize NeetCode 150 over random LeetCode grinding. Learn the pattern, not just the solution. Aim for 80%+ completion before your interview."],
          ].map(([title, desc]) => (
            <div key={title} className="callout callout-blue p-3">
              <div className="text-xs font-bold text-blue-400 mb-1">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
