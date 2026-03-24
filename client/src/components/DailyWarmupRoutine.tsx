/**
 * Daily Warm-Up Routine (15-Minute Daily)
 * 5 min pattern flashcards + 5 min complexity proofs + 5 min easy problem.
 * Builds the "interview brain" habit so candidates don't need a ramp-up on interview day.
 */
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Flame,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  CheckCircle2,
  Timer,
} from "lucide-react";
import { PATTERNS } from "@/lib/data";
import { usePatternRatings } from "@/hooks/useLocalStorage";

type Phase = "idle" | "flashcards" | "complexity" | "easy_problem" | "done";

const COMPLEXITY_PROOFS = [
  {
    problem: "Binary Search on sorted array",
    answer:
      "O(log n) time — halve the search space each step. O(1) space — no extra memory.",
  },
  {
    problem: "Merge Sort",
    answer:
      "O(n log n) time — O(log n) levels × O(n) merge per level. O(n) space for the merge buffer.",
  },
  {
    problem: "BFS on a graph with V vertices and E edges",
    answer:
      "O(V + E) time — visit each vertex once, traverse each edge once. O(V) space for the queue.",
  },
  {
    problem: "Hash map insert/lookup (amortized)",
    answer:
      "O(1) amortized time — occasional O(n) resize is amortized across n insertions. O(n) space.",
  },
  {
    problem: "Heap push/pop",
    answer:
      "O(log n) time — bubble up/down through height log n. O(1) space (in-place).",
  },
  {
    problem: "DFS on a tree with n nodes",
    answer:
      "O(n) time — visit each node once. O(h) space for call stack, where h is tree height (O(n) worst case for skewed tree).",
  },
];

const EASY_WARMUPS = [
  {
    title: "Two Sum",
    prompt:
      "Given an array and a target, return indices of two numbers that sum to target.",
    hint: "Hash map: store complement → index as you iterate.",
    pattern: "Hash Map",
  },
  {
    title: "Valid Parentheses",
    prompt: "Given a string of brackets, determine if it is valid.",
    hint: "Stack: push open brackets, pop and match on close brackets.",
    pattern: "Stack",
  },
  {
    title: "Reverse Linked List",
    prompt: "Reverse a singly linked list iteratively.",
    hint: "Three pointers: prev, curr, next. Iterate once.",
    pattern: "Linked List",
  },
  {
    title: "Maximum Depth of Binary Tree",
    prompt: "Find the maximum depth of a binary tree.",
    hint: "DFS: return 1 + max(depth(left), depth(right)).",
    pattern: "DFS / Recursion",
  },
  {
    title: "Climbing Stairs",
    prompt: "Count distinct ways to climb n stairs (1 or 2 steps at a time).",
    hint: "DP: dp[i] = dp[i-1] + dp[i-2]. Base: dp[1]=1, dp[2]=2.",
    pattern: "Dynamic Programming",
  },
];

export function DailyWarmupRoutine() {
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(300); // 5 min in seconds
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [complexityIdx, setComplexityIdx] = useState(0);
  const [showComplexityAnswer, setShowComplexityAnswer] = useState(false);
  const [warmupIdx, setWarmupIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completedPhases, setCompletedPhases] = useState<Phase[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [patternRatings] = usePatternRatings();

  // Prioritize weak patterns for flashcards
  const sortedPatterns = [...PATTERNS].sort(
    (a, b) => (patternRatings[a.id] ?? 0) - (patternRatings[b.id] ?? 0)
  );

  useEffect(() => {
    if (phase === "idle" || phase === "done") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          advancePhase();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const advancePhase = () => {
    setCompletedPhases(prev => [...prev, phase]);
    if (phase === "flashcards") {
      setPhase("complexity");
      setTimeLeft(300);
      setComplexityIdx(Math.floor(Math.random() * COMPLEXITY_PROOFS.length));
      setShowComplexityAnswer(false);
    } else if (phase === "complexity") {
      setPhase("easy_problem");
      setTimeLeft(300);
      setWarmupIdx(Math.floor(Math.random() * EASY_WARMUPS.length));
      setShowHint(false);
    } else if (phase === "easy_problem") {
      setPhase("done");
      toast.success("Daily warm-up complete! 🔥 You're ready to interview.");
    }
  };

  const startWarmup = () => {
    setPhase("flashcards");
    setTimeLeft(300);
    setFlashcardIdx(0);
    setShowAnswer(false);
    setCompletedPhases([]);
  };

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("idle");
    setTimeLeft(300);
    setCompletedPhases([]);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const PHASES = [
    { id: "flashcards", label: "Pattern Flashcards", duration: "5 min" },
    { id: "complexity", label: "Complexity Proofs", duration: "5 min" },
    { id: "easy_problem", label: "Easy Warm-Up", duration: "5 min" },
  ];

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-amber-500/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Flame size={16} className="text-amber-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground">
              15-Minute Daily Warm-Up
            </div>
            <div className="text-xs text-muted-foreground">
              Build interview brain. 5 min flashcards + 5 min complexity + 5 min
              easy problem.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
            Daily Habit
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-amber-500/20">
          {/* Phase progress */}
          <div className="mt-4 flex gap-2">
            {PHASES.map(p => (
              <div
                key={p.id}
                className={`flex-1 rounded-lg p-2 text-center text-xs border transition-all ${
                  completedPhases.includes(p.id as Phase)
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : phase === p.id
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-secondary/30 border-border text-muted-foreground"
                }`}
              >
                {completedPhases.includes(p.id as Phase) && (
                  <CheckCircle2 size={12} className="mx-auto mb-1" />
                )}
                <div className="font-medium">{p.label}</div>
                <div className="opacity-70">{p.duration}</div>
              </div>
            ))}
          </div>

          {/* Idle state */}
          {phase === "idle" && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                15 minutes every morning builds the "interview brain" reflex.
                Start now.
              </p>
              <button
                onClick={startWarmup}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors mx-auto"
              >
                <Play size={16} />
                Start Today's Warm-Up
              </button>
            </div>
          )}

          {/* Timer bar */}
          {phase !== "idle" && phase !== "done" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-muted-foreground font-medium">
                  {phase === "flashcards"
                    ? "Phase 1: Pattern Flashcards"
                    : phase === "complexity"
                      ? "Phase 2: Complexity Proofs"
                      : "Phase 3: Easy Warm-Up"}
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-mono text-sm font-bold">
                  <Timer size={13} />
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${(timeLeft / 300) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Flashcards phase */}
          {phase === "flashcards" && (
            <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
              <div className="text-xs text-muted-foreground">
                Card {flashcardIdx + 1} of {sortedPatterns.length} — weakest
                patterns first
              </div>
              <div className="text-base font-semibold text-foreground">
                {sortedPatterns[flashcardIdx]?.name}
              </div>
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  Show Pattern Details
                </button>
              ) : (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    <span className="text-foreground font-medium">
                      Key Idea:{" "}
                    </span>
                    {sortedPatterns[flashcardIdx]?.keyIdea}
                  </div>
                  <div>
                    <span className="text-foreground font-medium">
                      Examples:{" "}
                    </span>
                    {sortedPatterns[flashcardIdx]?.examples?.join(", ")}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFlashcardIdx(i => (i + 1) % sortedPatterns.length);
                    setShowAnswer(false);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  Next Card →
                </button>
                <button
                  onClick={advancePhase}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                >
                  Done with Flashcards ✓
                </button>
              </div>
            </div>
          )}

          {/* Complexity phase */}
          {phase === "complexity" && (
            <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
              <div className="text-xs text-muted-foreground">
                Prove this complexity out loud:
              </div>
              <div className="text-base font-semibold text-foreground">
                {COMPLEXITY_PROOFS[complexityIdx]?.problem}
              </div>
              {!showComplexityAnswer ? (
                <button
                  onClick={() => setShowComplexityAnswer(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  Reveal Answer
                </button>
              ) : (
                <div className="text-xs text-emerald-300 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  {COMPLEXITY_PROOFS[complexityIdx]?.answer}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setComplexityIdx(i => (i + 1) % COMPLEXITY_PROOFS.length);
                    setShowComplexityAnswer(false);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  Next Problem →
                </button>
                <button
                  onClick={advancePhase}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                >
                  Done ✓
                </button>
              </div>
            </div>
          )}

          {/* Easy problem phase */}
          {phase === "easy_problem" && (
            <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Easy
                </span>
                <span className="text-xs text-muted-foreground">
                  Pattern: {EASY_WARMUPS[warmupIdx]?.pattern}
                </span>
              </div>
              <div className="text-base font-semibold text-foreground">
                {EASY_WARMUPS[warmupIdx]?.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {EASY_WARMUPS[warmupIdx]?.prompt}
              </div>
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  Show Hint
                </button>
              ) : (
                <div className="text-xs text-blue-300 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  💡 {EASY_WARMUPS[warmupIdx]?.hint}
                </div>
              )}
              <button
                onClick={advancePhase}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors"
              >
                Done — Warm-Up Complete ✓
              </button>
            </div>
          )}

          {/* Done state */}
          {phase === "done" && (
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl">🔥</div>
              <div className="text-base font-semibold text-foreground">
                Warm-Up Complete!
              </div>
              <div className="text-sm text-muted-foreground">
                You've primed your interview brain. You're ready to tackle any
                problem today.
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm transition-colors mx-auto"
              >
                <RotateCcw size={14} />
                Reset for Tomorrow
              </button>
            </div>
          )}

          {phase !== "idle" && phase !== "done" && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
