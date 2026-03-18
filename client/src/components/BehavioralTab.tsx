// Design: Bold Engineering Dashboard — Behavioral Tab
// Features: search, practice mode (3-min timer), full mock session (4 questions),
// IC6/IC7 comparison table, mock history log, meta values, STAR framework
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Brain, Play, RotateCcw, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { BEHAVIORAL_QUESTIONS, IC_COMPARISON, META_VALUES } from "@/lib/data";
import { useBehavioralRatings, useMockHistory, type MockSession } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { nanoid } from "nanoid";

const AREAS = ["All", "Conflict & Influence", "Ownership & Ambiguity", "Scale & Impact", "Failure & Learning"];
const AREA_COLORS: Record<string, string> = {
  "Conflict & Influence": "badge-red",
  "Ownership & Ambiguity": "badge-amber",
  "Scale & Impact": "badge-blue",
  "Failure & Learning": "badge-purple",
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} className={`star-btn ${(hover || value) >= s ? "active" : ""}`}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => onChange(s)}>★</button>
      ))}
    </div>
  );
}

// ── Practice Mode ──────────────────────────────────────────────────────────
function PracticeMode({ ratings, onRate }: { ratings: Record<string, number>; onRate: (id: string, v: number) => void }) {
  const [qIdx, setQIdx] = useState(() => Math.floor(Math.random() * BEHAVIORAL_QUESTIONS.length));
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = BEHAVIORAL_QUESTIONS[qIdx];
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const pct = ((180 - timeLeft) / 180) * 100;
  const r = 36;
  const circ = 2 * Math.PI * r;

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(180); setRunning(false);
  }, []);

  const start = () => {
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setRunning(false); setRevealed(true); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const next = () => {
    setQIdx(Math.floor(Math.random() * BEHAVIORAL_QUESTIONS.length));
    setRevealed(false); reset();
  };

  return (
    <div className="prep-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Play size={14} className="text-purple-400" />
        <span className="text-sm font-semibold text-foreground">Practice Mode</span>
        <span className={`badge ${AREA_COLORS[q.area] ?? "badge-gray"}`}>{q.area}</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Timer ring */}
        <div className="relative w-20 h-20 shrink-0 mx-auto sm:mx-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="oklch(0.28 0.012 264)" strokeWidth="8" />
            <circle cx="50" cy="50" r={r} fill="none"
              stroke={timeLeft <= 30 ? "oklch(0.65 0.22 25)" : timeLeft <= 60 ? "oklch(0.78 0.17 75)" : "oklch(0.58 0.2 295)"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="mono text-sm font-bold text-foreground">{mm}:{ss}</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-foreground leading-relaxed">{q.q}</p>
          <div className="flex gap-2 flex-wrap">
            {!running && timeLeft === 180 && <button onClick={start} className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 text-xs font-semibold transition-all">Start Timer</button>}
            {running && <button onClick={reset} className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all">Reset</button>}
            <button onClick={() => setRevealed(r => !r)} className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all">
              {revealed ? "Hide" : "Reveal"} Probes
            </button>
            <button onClick={next} className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all">Next Question →</button>
          </div>
          {revealed && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-secondary text-xs text-muted-foreground">{q.hint}</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Rate your answer:</span>
                <StarRating value={ratings[q.id] ?? 0} onChange={v => { onRate(q.id, v); next(); }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Full Mock Session ──────────────────────────────────────────────────────
function FullMockSession({ onComplete }: { onComplete: (session: MockSession) => void }) {
  const FOCUS_AREAS = ["Conflict & Influence", "Ownership & Ambiguity", "Scale & Impact", "Failure & Learning"];
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [running, setRunning] = useState(false);
  const [ratings, setRatings] = useState<number[]>([0, 0, 0, 0]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick one random question per focus area
  const [questions] = useState(() =>
    FOCUS_AREAS.map(area => {
      const pool = BEHAVIORAL_QUESTIONS.filter(q => q.area === area);
      return pool[Math.floor(Math.random() * pool.length)];
    })
  );

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const pct = ((180 - timeLeft) / 180) * 100;
  const r = 40;
  const circ = 2 * Math.PI * r;

  const startTimer = useCallback(() => {
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setRunning(false); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  const pauseTimer = () => { if (timerRef.current) clearInterval(timerRef.current); setRunning(false); };
  const resetTimer = () => { pauseTimer(); setTimeLeft(180); };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const rateAndNext = (rating: number) => {
    const newRatings = [...ratings];
    newRatings[step] = rating;
    setRatings(newRatings);
    if (step < 3) {
      setStep(step + 1);
      resetTimer();
    } else {
      // Done
      clearInterval(timerRef.current!);
      const avg = newRatings.reduce((s, r) => s + r, 0) / 4;
      const session: MockSession = {
        id: nanoid(),
        date: new Date().toISOString(),
        questions: questions.map(q => ({ text: q.q, area: q.area })),
        ratings: newRatings,
        avgScore: avg,
      };
      onComplete(session);
      setPhase("done");
    }
  };

  if (phase === "idle") {
    return (
      <div className="prep-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-foreground">Full Mock Session</span>
          <span className="badge badge-blue">4 questions · 3 min each</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Simulates a real behavioral interview. One question per focus area, 3-minute timer each. Rate yourself honestly at the end of each question.</p>
        <button onClick={() => setPhase("running")}
          className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all">
          Start Full Mock
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const avg = ratings.reduce((s, r) => s + r, 0) / 4;
    return (
      <div className="prep-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">Mock Complete</span>
          <span className="badge badge-green">Session saved</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {questions.map((q, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary text-center">
              <div className="text-xs text-muted-foreground mb-1 truncate">{q.area}</div>
              <div className="text-xl font-bold text-foreground stat-num">★{ratings[i]}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <span className="text-sm text-muted-foreground">Session average:</span>
          <span className="text-xl font-bold text-emerald-400 stat-num">{avg.toFixed(1)}/5</span>
        </div>
        <button onClick={() => { setPhase("idle"); setStep(0); setRatings([0,0,0,0]); resetTimer(); }}
          className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-sm font-semibold text-foreground transition-all">
          Start New Mock
        </button>
      </div>
    );
  }

  // Running
  const q = questions[step];
  return (
    <div className="prep-card p-5">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-4">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? "bg-emerald-500" : i === step ? "bg-blue-500" : "bg-secondary"}`} />
        ))}
        <span className="text-xs text-muted-foreground shrink-0">Q{step+1}/4</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Timer ring */}
        <div className="relative w-24 h-24 shrink-0 mx-auto sm:mx-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="oklch(0.28 0.012 264)" strokeWidth="8" />
            <circle cx="50" cy="50" r={r} fill="none"
              stroke={timeLeft <= 30 ? "oklch(0.65 0.22 25)" : "oklch(0.62 0.19 258)"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="mono text-lg font-bold text-foreground">{mm}:{ss}</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <span className={`badge ${AREA_COLORS[q.area] ?? "badge-gray"}`}>{q.area}</span>
          <p className="text-sm font-medium text-foreground leading-relaxed">{q.q}</p>
          <div className="flex gap-2 flex-wrap">
            {!running && <button onClick={startTimer} className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all">Start Timer</button>}
            {running && <button onClick={pauseTimer} className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all">Pause</button>}
            <button onClick={resetTimer} className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all">
              <RotateCcw size={11} className="inline mr-1" />Reset
            </button>
          </div>
          <div className="p-3 rounded-lg bg-secondary text-xs text-muted-foreground">{q.hint}</div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Rate & continue:</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(v => (
                <button key={v} onClick={() => rateAndNext(v)}
                  className="w-8 h-8 rounded-md bg-secondary hover:bg-blue-500/20 hover:text-blue-400 text-sm font-bold text-muted-foreground transition-all border border-border hover:border-blue-500/40">
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mock History Log ───────────────────────────────────────────────────────
function MockHistoryLog({ history, onClear }: { history: MockSession[]; onClear: () => void }) {
  const [expanded, setExpanded] = useState(false);
  if (history.length === 0) return null;

  const avg = history.reduce((s, m) => s + m.avgScore, 0) / history.length;
  const best = Math.max(...history.map(m => m.avgScore));
  const last3 = history.slice(-3).map(m => m.avgScore);
  const trend = last3.length >= 2 ? (last3[last3.length-1] > last3[0] ? "↑ Up" : last3[last3.length-1] < last3[0] ? "↓ Down" : "→ Flat") : "—";

  return (
    <div className="prep-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Brain size={14} className="text-indigo-400" />
        <span className="text-sm font-semibold text-foreground">Full Mock Session History</span>
        <span className="badge badge-indigo ml-auto">{history.length} sessions</span>
        <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="p-3 rounded-lg bg-secondary text-center">
          <div className="stat-num text-xl text-foreground">{avg.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">Overall avg</div>
        </div>
        <div className="p-3 rounded-lg bg-secondary text-center">
          <div className="stat-num text-xl text-emerald-400">{best.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">Best session</div>
        </div>
        <div className="p-3 rounded-lg bg-secondary text-center">
          <div className="stat-num text-xl text-blue-400">{trend}</div>
          <div className="text-xs text-muted-foreground">Trend (last 3)</div>
        </div>
      </div>
      {expanded && (
        <div className="space-y-2 mt-3">
          {history.slice().reverse().map(session => (
            <div key={session.id} className="p-3 rounded-lg bg-secondary text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">{new Date(session.date).toLocaleDateString()}</span>
                <span className="font-bold text-foreground">avg ★{session.avgScore.toFixed(1)}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {session.questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={`badge ${AREA_COLORS[q.area] ?? "badge-gray"} text-xs`}>{q.area.split(" ")[0]}</span>
                    <span className="text-amber-400">★{session.ratings[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={onClear} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors mt-2">
            <Trash2 size={11} /> Clear all history
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main BehavioralTab ─────────────────────────────────────────────────────
export default function BehavioralTab() {
  const [ratings, setRatings] = useBehavioralRatings();
  const [history, setHistory] = useMockHistory();
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("All");
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [showMock, setShowMock] = useState(false);
  const [showPractice, setShowPractice] = useState(false);

  const handleRate = (id: string, v: number) => setRatings(r => ({ ...r, [id]: v }));

  const handleMockComplete = (session: MockSession) => {
    setHistory(h => [...h, session]);
    toast.success(`Mock session saved! Average: ★${session.avgScore.toFixed(1)}`);
    setShowMock(false);
  };

  const filtered = BEHAVIORAL_QUESTIONS.filter(q => {
    const s = search.toLowerCase();
    return (filterArea === "All" || q.area === filterArea) &&
      (!s || q.q.toLowerCase().includes(s) || q.hint.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-5">
      {/* Meta Values */}
      <div className="prep-card p-5">
        <div className="section-title">
          <Brain size={14} className="text-purple-400" />
          Meta's Core Values
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {META_VALUES.map(v => (
            <div key={v.name} className="p-3 rounded-lg bg-secondary border border-border">
              <div className="text-xs font-bold text-foreground mb-1">{v.name}</div>
              <div className="text-xs text-muted-foreground">{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* IC6 vs IC7 Comparison */}
      <div className="prep-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="section-title mb-0 pb-0 border-0">IC6 vs IC7 Behavioral Expectations</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dimension</th>
                <th className="text-left p-3 text-xs font-semibold text-blue-400 uppercase tracking-wider">IC6 — Staff</th>
                <th className="text-left p-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">IC7 — Senior Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {IC_COMPARISON.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                  <td className="p-3 text-xs font-semibold text-foreground">{row.dimension}</td>
                  <td className="p-3 text-xs text-muted-foreground">{row.ic6}</td>
                  <td className="p-3 text-xs text-muted-foreground">{row.ic7}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Practice / Mock buttons */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => { setShowPractice(p => !p); setShowMock(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${showPractice ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
          <Play size={13} /> Practice Mode
        </button>
        <button onClick={() => { setShowMock(m => !m); setShowPractice(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${showMock ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
          <Brain size={13} /> Full Mock Session
        </button>
      </div>

      {showPractice && <PracticeMode ratings={ratings} onRate={handleRate} />}
      {showMock && <FullMockSession onComplete={handleMockComplete} />}

      {/* Mock History */}
      <MockHistoryLog history={history} onClear={() => { setHistory([]); toast.success("History cleared."); }} />

      {/* STAR Framework */}
      <div className="prep-card p-5">
        <div className="section-title">STAR Framework</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["S — Situation", "Set the scene. 1–2 sentences max. Context only, no solution yet.", "text-blue-400"],
            ["T — Task", "Your specific responsibility. What were YOU asked to do?", "text-amber-400"],
            ["A — Action", "The bulk of your answer. What YOU did, step by step. Use 'I', not 'we'.", "text-purple-400"],
            ["R — Result", "Quantify the outcome. Business impact, not just technical completion.", "text-emerald-400"],
          ].map(([title, desc, color]) => (
            <div key={title} className="p-3 rounded-lg bg-secondary">
              <div className={`text-xs font-bold mb-1 ${color}`}>{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search questions and probes…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50" />
        </div>
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none">
          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {filtered.map(q => {
          const r = ratings[q.id] ?? 0;
          const isOpen = expandedQ === q.id;
          return (
            <div key={q.id} className="bq-item">
              <button className="bq-trigger" onClick={() => setExpandedQ(isOpen ? null : q.id)}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`badge ${AREA_COLORS[q.area] ?? "badge-gray"} shrink-0`}>{q.area.split(" ")[0]}</span>
                  <span className="truncate text-left">{q.q}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r > 0 && <span className="text-amber-400 text-xs font-bold">★{r}</span>}
                  {r >= 4 && <span className="badge badge-green text-xs">Ready</span>}
                  {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </div>
              </button>
              {isOpen && (
                <div className="bq-body space-y-3">
                  <div className="p-2.5 rounded-md bg-secondary/50 text-xs text-muted-foreground">{q.hint}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Rate your story:</span>
                    <StarRating value={r} onChange={v => handleRate(q.id, v)} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No questions match your search.</div>
        )}
      </div>
    </div>
  );
}
