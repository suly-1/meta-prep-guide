/**
 * Code Practice AI Panel
 * 6 AI-powered features for the Code Practice tab:
 * 1. AI Solution Reviewer — IC6/IC7 rubric scoring
 * 2. 3-Level Hint System — progressive hints
 * 3. Follow-Up Question Generator — interviewer follow-ups
 * 4. Complexity Analyzer — actual vs optimal
 * 5. Pattern Recognition Trainer — hide label, score guess
 * 6. IC7 Optimization Challenge — push to optimal
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Brain, Lightbulb, MessageSquare, Gauge, Target, Zap,
  ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle,
  AlertTriangle, Star, TrendingUp, ArrowRight
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Problem {
  id: string;
  title: string;
  difficulty: string;
  topic: string;
  description: string;
  hints: string[];
}

interface CodePracticeAIProps {
  problem: Problem;
  code: string;
  language: string;
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ label, value, max = 5, color = "bg-blue-500" }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-foreground w-8 text-right">{value}/{max}</span>
    </div>
  );
}

// ── IC Level badge ────────────────────────────────────────────────────────────
function ICBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    IC5: "bg-slate-500/20 border-slate-500/40 text-slate-300",
    IC6: "bg-blue-500/20 border-blue-500/40 text-blue-300",
    IC7: "bg-purple-500/20 border-purple-500/40 text-purple-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${colors[level] ?? colors.IC6}`}>
      {level}
    </span>
  );
}

// ── 1. AI Solution Reviewer ───────────────────────────────────────────────────
export function AISolutionReviewer({ problem, code, language }: CodePracticeAIProps) {
  const [icMode, setIcMode] = useState<"IC6" | "IC7">("IC6");
  const [open, setOpen] = useState(false);
  const reviewMutation = trpc.ai.reviewSolution.useMutation({
    onError: () => toast.error("Review failed. Please try again."),
  });

  const handleReview = () => {
    if (!code.trim() || code.trim() === problem.title) {
      toast.error("Write some code first before requesting a review.");
      return;
    }
    reviewMutation.mutate({
      problemTitle: problem.title,
      difficulty: problem.difficulty,
      topic: problem.topic,
      code,
      language,
      icMode,
    });
    setOpen(true);
  };

  const r = reviewMutation.data;
  const scoreColor = r ? (r.score >= 4 ? "text-emerald-400" : r.score >= 3 ? "text-blue-400" : r.score >= 2 ? "text-amber-400" : "text-red-400") : "text-foreground";

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-foreground">AI Solution Reviewer</span>
          <span className="text-xs text-muted-foreground">IC6/IC7 rubric scoring</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-blue-500/10">
          {/* Controls */}
          <div className="flex items-center gap-3 pt-3">
            <div className="flex gap-1">
              {(["IC6", "IC7"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setIcMode(mode)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    icMode === mode
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {mode} Bar
                </button>
              ))}
            </div>
            <button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold transition-all"
            >
              {reviewMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Brain size={11} />}
              {reviewMutation.isPending ? "Reviewing…" : "Review My Code"}
            </button>
          </div>

          {/* Results */}
          {r && (
            <div className="space-y-3">
              {/* Verdict */}
              <div className="rounded-lg bg-background border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black ${scoreColor}`}>{r.score.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">/5.0</span>
                  </div>
                  <ICBadge level={r.icLevel} />
                </div>
                <p className="text-xs text-foreground italic">"{r.verdict}"</p>
              </div>

              {/* Rubric bars */}
              <div className="space-y-1.5">
                <ScoreBar label="Correctness" value={r.correctness} color="bg-emerald-500" />
                <ScoreBar label="Complexity" value={r.complexity} color="bg-blue-500" />
                <ScoreBar label="Edge Cases" value={r.edgeCases} color="bg-amber-500" />
                <ScoreBar label="Code Quality" value={r.codeQuality} color="bg-purple-500" />
              </div>

              {/* Optimal complexity */}
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp size={11} className="text-blue-400 shrink-0" />
                <span className="text-muted-foreground">Optimal:</span>
                <span className="font-mono text-blue-300">{r.optimalComplexity}</span>
              </div>

              {/* Strengths */}
              <div className="space-y-1">
                {r.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs">
                    <CheckCircle size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{s}</span>
                  </div>
                ))}
              </div>

              {/* Coaching note */}
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="flex items-start gap-1.5">
                  <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-amber-400">Coaching: </span>
                    <span className="text-xs text-muted-foreground">{r.coaching}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 2. 3-Level Hint System ────────────────────────────────────────────────────
export function ProgressiveHintSystem({ problem, code: _code, language: _lang }: CodePracticeAIProps) {
  const [open, setOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [hints, setHints] = useState<Array<{ level: number; hint: string }>>([]);
  const hintMutation = trpc.ai.getProgressiveHint.useMutation({
    onSuccess: (data) => {
      setHints(h => [...h, data]);
      setCurrentLevel(data.level);
    },
    onError: () => toast.error("Failed to get hint. Please try again."),
  });

  const levelLabels = ["Pattern Recognition", "Approach", "Pseudocode Skeleton"];
  const levelColors = ["text-amber-400 border-amber-500/30 bg-amber-500/10", "text-orange-400 border-orange-500/30 bg-orange-500/10", "text-red-400 border-red-500/30 bg-red-500/10"];

  const requestHint = (level: number) => {
    hintMutation.mutate({
      problemTitle: problem.title,
      difficulty: problem.difficulty,
      topic: problem.topic,
      description: problem.description,
      level,
    });
  };

  const reset = () => { setHints([]); setCurrentLevel(0); };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-400" />
          <span className="text-sm font-semibold text-foreground">AI Hint System</span>
          <span className="text-xs text-muted-foreground">3 progressive levels — no spoilers</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-500/10">
          {/* Level buttons */}
          <div className="flex gap-2 pt-3">
            {levelLabels.map((label, i) => {
              const level = i + 1;
              const isUnlocked = currentLevel >= level;
              const isNext = currentLevel === i;
              return (
                <button
                  key={level}
                  onClick={() => isNext && requestHint(level)}
                  disabled={!isNext || hintMutation.isPending}
                  className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    isUnlocked
                      ? `${levelColors[i]} opacity-60`
                      : isNext
                        ? `${levelColors[i]} hover:opacity-90`
                        : "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                  }`}
                >
                  <span>L{level}</span>
                  <span className="text-[9px] font-normal opacity-80 text-center leading-tight">{label}</span>
                </button>
              );
            })}
            {hints.length > 0 && (
              <button onClick={reset} className="px-2 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                Reset
              </button>
            )}
          </div>

          {hintMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={11} className="animate-spin" />
              Getting Level {currentLevel + 1} hint…
            </div>
          )}

          {/* Hint cards */}
          {hints.map((h) => (
            <div key={h.level} className={`rounded-lg border p-3 ${levelColors[h.level - 1]}`}>
              <div className="text-[10px] font-bold mb-1 opacity-70">LEVEL {h.level} — {levelLabels[h.level - 1].toUpperCase()}</div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{h.hint}</p>
            </div>
          ))}

          {hints.length === 0 && !hintMutation.isPending && (
            <p className="text-xs text-muted-foreground">Start with Level 1 — pattern recognition only. Each level reveals more without giving away the solution.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── 3. Follow-Up Question Generator ──────────────────────────────────────────
export function FollowUpGenerator({ problem, code, language: _lang }: CodePracticeAIProps) {
  const [open, setOpen] = useState(false);
  const [icMode, setIcMode] = useState<"IC6" | "IC7">("IC6");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const followUpMutation = trpc.ai.generateFollowUps.useMutation({
    onError: () => toast.error("Failed to generate follow-ups. Please try again."),
  });

  const handleGenerate = () => {
    if (!code.trim()) { toast.error("Write some code first."); return; }
    followUpMutation.mutate({ problemTitle: problem.title, difficulty: problem.difficulty, topic: problem.topic, code, icMode });
  };

  const icColors: Record<string, string> = {
    IC6: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    IC7: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-purple-400" />
          <span className="text-sm font-semibold text-foreground">Follow-Up Generator</span>
          <span className="text-xs text-muted-foreground">Interviewer questions after your solution</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-purple-500/10">
          <div className="flex items-center gap-3 pt-3">
            <div className="flex gap-1">
              {(["IC6", "IC7"] as const).map(mode => (
                <button key={mode} onClick={() => setIcMode(mode)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${icMode === mode ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
                  {mode}
                </button>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={followUpMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-semibold transition-all">
              {followUpMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <MessageSquare size={11} />}
              {followUpMutation.isPending ? "Generating…" : "Generate Follow-Ups"}
            </button>
          </div>

          {followUpMutation.data?.questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-purple-500/20 bg-background overflow-hidden">
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-purple-500/5 transition-colors"
              >
                <span className="shrink-0 w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span className="flex-1 text-xs text-foreground leading-relaxed">{q.question}</span>
                <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border ${icColors[q.icLevel] ?? icColors.IC6}`}>{q.icLevel}</span>
              </button>
              {expandedIdx === i && (
                <div className="px-3 pb-2.5 border-t border-purple-500/10">
                  <div className="flex items-start gap-1.5 mt-2">
                    <ArrowRight size={10} className="text-purple-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground italic">{q.intent}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!followUpMutation.data && !followUpMutation.isPending && (
            <p className="text-xs text-muted-foreground">Submit your solution first, then generate the follow-up questions a real Meta interviewer would ask.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── 4. Complexity Analyzer ────────────────────────────────────────────────────
export function ComplexityAnalyzer({ problem, code, language }: CodePracticeAIProps) {
  const [open, setOpen] = useState(false);
  const complexityMutation = trpc.ai.analyzeComplexity.useMutation({
    onError: () => toast.error("Analysis failed. Please try again."),
  });

  const handleAnalyze = () => {
    if (!code.trim()) { toast.error("Write some code first."); return; }
    complexityMutation.mutate({ problemTitle: problem.title, topic: problem.topic, code, language });
  };

  const r = complexityMutation.data;

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">Complexity Analyzer</span>
          <span className="text-xs text-muted-foreground">Actual vs optimal time/space</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-emerald-500/10">
          <div className="pt-3">
            <button onClick={handleAnalyze} disabled={complexityMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold transition-all">
              {complexityMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Gauge size={11} />}
              {complexityMutation.isPending ? "Analyzing…" : "Analyze Complexity"}
            </button>
          </div>

          {r && (
            <div className="space-y-3">
              {/* Complexity grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Your Time", value: r.actualTime, color: r.isOptimal ? "text-emerald-400" : "text-amber-400" },
                  { label: "Your Space", value: r.actualSpace, color: r.isOptimal ? "text-emerald-400" : "text-amber-400" },
                  { label: "Optimal Time", value: r.optimalTime, color: "text-emerald-400" },
                  { label: "Optimal Space", value: r.optimalSpace, color: "text-emerald-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg bg-background border border-border p-2.5 text-center">
                    <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
                    <div className={`text-sm font-black font-mono ${color}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Optimal badge */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${r.isOptimal ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"}`}>
                {r.isOptimal ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                {r.isOptimal ? "Your solution is already optimal!" : "Gap to optimal detected"}
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <div className="rounded-lg bg-background border border-border p-3">
                  <div className="text-[10px] font-semibold text-muted-foreground mb-1">COMPLEXITY EXPLANATION</div>
                  <p className="text-xs text-foreground">{r.timeExplanation}</p>
                </div>
                <div className="rounded-lg bg-background border border-border p-3">
                  <div className="text-[10px] font-semibold text-muted-foreground mb-1">BOTTLENECK</div>
                  <p className="text-xs font-mono text-amber-300">{r.bottleneck}</p>
                </div>
                {!r.isOptimal && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <div className="text-[10px] font-semibold text-emerald-400 mb-1">HOW TO REACH OPTIMAL</div>
                    <p className="text-xs text-muted-foreground">{r.gapExplanation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!r && !complexityMutation.isPending && (
            <p className="text-xs text-muted-foreground">Paste or write your solution, then analyze to see if you've reached optimal complexity.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── 5. Pattern Recognition Trainer ───────────────────────────────────────────
export function PatternRecognitionTrainer({ problem, code: _code, language: _lang }: CodePracticeAIProps) {
  const [open, setOpen] = useState(false);
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const scoreMutation = trpc.ai.scorePatternGuess.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: () => toast.error("Scoring failed. Please try again."),
  });

  const handleSubmit = () => {
    if (!guess.trim()) { toast.error("Enter your pattern guess first."); return; }
    scoreMutation.mutate({
      problemTitle: problem.title,
      description: problem.description,
      correctTopic: problem.topic,
      candidateGuess: guess,
    });
  };

  const reset = () => { setGuess(""); setSubmitted(false); scoreMutation.reset(); };

  const r = scoreMutation.data;
  const scoreColors = ["text-red-400", "text-amber-400", "text-blue-400", "text-emerald-400"];

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-cyan-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-foreground">Pattern Recognition Trainer</span>
          <span className="text-xs text-muted-foreground">Identify the pattern before coding</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-cyan-500/10">
          <p className="text-xs text-muted-foreground pt-3">
            Before writing any code, identify the algorithmic pattern. This trains the most critical first-2-minute skill in a Meta interview.
          </p>

          {!submitted ? (
            <div className="space-y-2">
              <input
                value={guess}
                onChange={e => setGuess(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="e.g. Two Pointers, Sliding Window, BFS, DP…"
                className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button onClick={handleSubmit} disabled={scoreMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-semibold transition-all">
                {scoreMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Target size={11} />}
                {scoreMutation.isPending ? "Scoring…" : "Submit Guess"}
              </button>
            </div>
          ) : r && (
            <div className="space-y-3">
              {/* Score */}
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <Star key={i} size={14} className={i <= r.score ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />
                  ))}
                </div>
                <span className={`text-sm font-bold ${scoreColors[r.score] ?? "text-foreground"}`}>
                  {r.score === 3 ? "Exactly right!" : r.score === 2 ? "Right pattern, different name" : r.score === 1 ? "Partially correct" : "Incorrect"}
                </span>
                {r.isCorrect ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
              </div>

              {/* Feedback */}
              <div className="rounded-lg bg-background border border-border p-3 space-y-2">
                <p className="text-xs text-foreground">{r.feedback}</p>
                <div className="flex items-start gap-1.5">
                  <Target size={10} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground"><span className="text-cyan-400 font-semibold">Key signal: </span>{r.keySignal}</span>
                </div>
              </div>

              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Try again with a different guess
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 6. IC7 Optimization Challenge ────────────────────────────────────────────
export function IC7OptimizationChallenge({ problem, code, language }: CodePracticeAIProps) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const challengeMutation = trpc.ai.ic7OptimizationChallenge.useMutation({
    onError: () => toast.error("Challenge failed. Please try again."),
  });

  const handleChallenge = (withHint = false) => {
    if (!code.trim()) { toast.error("Write your solution first."); return; }
    setShowHint(withHint);
    challengeMutation.mutate({
      problemTitle: problem.title,
      topic: problem.topic,
      code,
      language,
      currentComplexity: "as written",
      targetComplexity: "optimal",
      hint: withHint,
    });
  };

  const r = challengeMutation.data;

  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-orange-400" />
          <span className="text-sm font-semibold text-foreground">IC7 Optimization Challenge</span>
          <span className="text-xs text-muted-foreground">Push your solution to optimal</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-orange-500/10">
          <p className="text-xs text-muted-foreground pt-3">
            An IC7 engineer challenges you to optimize. Can you defend your solution and push it further?
          </p>

          <div className="flex gap-2">
            <button onClick={() => handleChallenge(false)} disabled={challengeMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold transition-all">
              {challengeMutation.isPending && !showHint ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
              Challenge Me
            </button>
            <button onClick={() => handleChallenge(true)} disabled={challengeMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 disabled:opacity-50 text-orange-300 text-xs font-semibold transition-all">
              {challengeMutation.isPending && showHint ? <Loader2 size={11} className="animate-spin" /> : <Lightbulb size={11} />}
              Challenge + Hint
            </button>
          </div>

          {r && (
            <div className="space-y-3">
              {/* Challenge statement */}
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-3">
                <div className="text-[10px] font-bold text-orange-400 mb-1">IC7 CHALLENGE</div>
                <p className="text-xs text-foreground font-medium">"{r.challenge}"</p>
              </div>

              {/* Probe question */}
              <div className="rounded-lg bg-background border border-border p-3">
                <div className="text-[10px] font-semibold text-muted-foreground mb-1">INTERVIEWER ASKS</div>
                <p className="text-xs text-foreground italic">"{r.probeQuestion}"</p>
              </div>

              {/* IC7 insight */}
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
                <div className="text-[10px] font-bold text-purple-400 mb-1">WHAT IC7 SEES IMMEDIATELY</div>
                <p className="text-xs text-muted-foreground">{r.ic7Insight}</p>
              </div>

              {/* Hint (if requested) */}
              {r.hint && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <div className="text-[10px] font-bold text-amber-400 mb-1">DIRECTIONAL HINT</div>
                  <p className="text-xs text-muted-foreground">{r.hint}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main AI Panel (all 6 features) ────────────────────────────────────────────
export function CodePracticeAIPanel({ problem, code, language }: CodePracticeAIProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Brain size={13} className="text-blue-400" />
        <span className="text-xs font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          AI Practice Tools
        </span>
        <span className="text-[10px] text-muted-foreground">Powered by Meta-trained rubrics</span>
      </div>
      <PatternRecognitionTrainer problem={problem} code={code} language={language} />
      <ProgressiveHintSystem problem={problem} code={code} language={language} />
      <AISolutionReviewer problem={problem} code={code} language={language} />
      <ComplexityAnalyzer problem={problem} code={code} language={language} />
      <FollowUpGenerator problem={problem} code={code} language={language} />
      <IC7OptimizationChallenge problem={problem} code={code} language={language} />
    </div>
  );
}
