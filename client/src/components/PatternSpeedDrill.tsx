/**
 * #5 — Pattern Recognition Speed Drill
 * 60-second timed drill: candidate sees a problem description and must identify
 * the correct pattern within 10 seconds. Tracks accuracy and speed over time.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { usePatternRatings } from "@/hooks/useLocalStorage";
import { PATTERNS } from "@/lib/data";
import {
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Timer,
  Trophy,
  RefreshCw,
  Target,
} from "lucide-react";
import { toast } from "sonner";

// Problem descriptions mapped to patterns
const PATTERN_PROBLEMS: Array<{
  problem: string;
  correctPattern: string;
  hint: string;
}> = [
  {
    problem:
      "Find the maximum sum of a contiguous subarray of length k in an array of integers.",
    correctPattern: "sliding-window",
    hint: "Fixed-size window moving through array",
  },
  {
    problem:
      "Given a sorted array, find if there exist two numbers that sum to a target value.",
    correctPattern: "two-pointers",
    hint: "Two indices converging from both ends",
  },
  {
    problem:
      "Detect if a linked list has a cycle. If yes, find the start of the cycle.",
    correctPattern: "fast-slow",
    hint: "Floyd's cycle detection algorithm",
  },
  {
    problem:
      "Find the minimum element in a rotated sorted array in O(log n) time.",
    correctPattern: "binary-search",
    hint: "Search on a modified sorted structure",
  },
  {
    problem:
      "Given a binary tree, return the level-order traversal of its nodes' values.",
    correctPattern: "bfs-graphs",
    hint: "Process nodes level by level using a queue",
  },
  {
    problem:
      "Find all possible paths from source to destination in a directed graph.",
    correctPattern: "dfs-backtrack",
    hint: "Explore all paths, backtrack when stuck",
  },
  {
    problem:
      "Given a list of intervals, find the minimum number of meeting rooms required.",
    correctPattern: "heap-priority",
    hint: "Track end times of active meetings",
  },
  {
    problem:
      "Find the kth largest element in an unsorted array in O(n) average time.",
    correctPattern: "heap-priority",
    hint: "Maintain a min-heap of size k",
  },
  {
    problem:
      "Given a string, find the length of the longest substring without repeating characters.",
    correctPattern: "sliding-window",
    hint: "Variable-size window with a set/map",
  },
  {
    problem:
      "Find the number of islands in a 2D grid of '1's (land) and '0's (water).",
    correctPattern: "dfs-backtrack",
    hint: "DFS from each unvisited land cell",
  },
  {
    problem:
      "Given n tasks with cooldown intervals, find the minimum time to finish all tasks.",
    correctPattern: "heap-priority",
    hint: "Greedy with a max-heap of frequencies",
  },
  {
    problem:
      "Determine if a string can be segmented into words from a given dictionary.",
    correctPattern: "dp-1d",
    hint: "Build up solutions for substrings",
  },
  {
    problem: "Find the longest common subsequence of two strings.",
    correctPattern: "dp-2d",
    hint: "2D table where dp[i][j] = LCS of first i and j chars",
  },
  {
    problem:
      "Given a list of courses with prerequisites, find a valid order to take all courses.",
    correctPattern: "topological-sort",
    hint: "Detect cycle + ordering in a DAG",
  },
  {
    problem: "Find all anagrams of a pattern string within a larger string.",
    correctPattern: "sliding-window",
    hint: "Fixed window with character frequency map",
  },
  {
    problem:
      "Given a binary tree, find the lowest common ancestor of two nodes.",
    correctPattern: "dfs-backtrack",
    hint: "Post-order DFS — check left, right, root",
  },
  {
    problem: "Find the shortest path between two nodes in an unweighted graph.",
    correctPattern: "bfs-graphs",
    hint: "BFS guarantees shortest path in unweighted graphs",
  },
  {
    problem:
      "Given a sorted matrix, find if a target value exists in O(m+n) time.",
    correctPattern: "two-pointers",
    hint: "Start from top-right corner",
  },
];

const DRILL_DURATION = 60; // seconds
const TIME_PER_QUESTION = 10; // seconds

interface DrillResult {
  problem: string;
  correctPattern: string;
  selectedPattern: string;
  correct: boolean;
  timeUsed: number;
}

export function PatternSpeedDrill() {
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<"idle" | "drilling" | "done">("idle");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [problems, setProblems] = useState<typeof PATTERN_PROBLEMS>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [totalTime, setTotalTime] = useState(DRILL_DURATION);
  const [results, setResults] = useState<DrillResult[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [patternRatings] = usePatternRatings();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeUsedRef = useRef(0);

  const currentProblem = problems[currentIdx];

  // Shuffle and pick 8 problems, prioritizing weak patterns
  function startDrill() {
    const weakPatternIds = PATTERNS.filter(
      p => (patternRatings[p.id] ?? 0) <= 2
    ).map(p => p.id);

    const weakProblems = PATTERN_PROBLEMS.filter(p =>
      weakPatternIds.includes(p.correctPattern)
    );
    const otherProblems = PATTERN_PROBLEMS.filter(
      p => !weakPatternIds.includes(p.correctPattern)
    );

    const shuffled = [
      ...weakProblems.sort(() => Math.random() - 0.5),
      ...otherProblems.sort(() => Math.random() - 0.5),
    ].slice(0, 8);

    setProblems(shuffled);
    setCurrentIdx(0);
    setResults([]);
    setTimeLeft(TIME_PER_QUESTION);
    setTotalTime(DRILL_DURATION);
    setPhase("drilling");
    setShowHint(false);
    timeUsedRef.current = 0;
  }

  const advanceQuestion = useCallback(
    (selectedPattern: string | null) => {
      if (!currentProblem) return;
      const correct = selectedPattern === currentProblem.correctPattern;
      const result: DrillResult = {
        problem: currentProblem.problem,
        correctPattern: currentProblem.correctPattern,
        selectedPattern: selectedPattern ?? "timeout",
        correct,
        timeUsed: TIME_PER_QUESTION - timeLeft,
      };
      setResults(prev => [...prev, result]);
      if (!correct && selectedPattern !== null) {
        toast.error(
          `Incorrect — it's ${PATTERNS.find(p => p.id === currentProblem.correctPattern)?.name ?? currentProblem.correctPattern}`
        );
      }
      const nextIdx = currentIdx + 1;
      if (nextIdx >= problems.length) {
        setPhase("done");
        if (timerRef.current) clearInterval(timerRef.current);
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      } else {
        setCurrentIdx(nextIdx);
        setTimeLeft(TIME_PER_QUESTION);
        setShowHint(false);
        timeUsedRef.current = 0;
      }
    },
    [currentProblem, currentIdx, problems.length, timeLeft]
  );

  useEffect(() => {
    if (phase !== "drilling") return;
    // Total session timer
    timerRef.current = setInterval(() => {
      setTotalTime(t => {
        if (t <= 1) {
          setPhase("done");
          if (timerRef.current) clearInterval(timerRef.current);
          if (questionTimerRef.current) clearInterval(questionTimerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "drilling") return;
    // Per-question timer
    questionTimerRef.current = setInterval(() => {
      timeUsedRef.current += 1;
      setTimeLeft(t => {
        if (t <= 1) {
          advanceQuestion(null); // timeout
          return TIME_PER_QUESTION;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [phase, currentIdx, advanceQuestion]);

  const correctCount = results.filter(r => r.correct).length;
  const accuracy =
    results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const avgTime =
    results.length > 0
      ? (results.reduce((a, r) => a + r.timeUsed, 0) / results.length).toFixed(
          1
        )
      : null;

  // Get 4 random pattern options including the correct one
  function getOptions(correctId: string) {
    const others = PATTERNS.filter(p => p.id !== correctId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(p => p.id);
    return [...others, correctId].sort(() => Math.random() - 0.5);
  }

  const [options] = useState<string[][]>(() =>
    PATTERN_PROBLEMS.map(p => getOptions(p.correctPattern))
  );

  return (
    <div
      id="coding-speed-drill"
      className="rounded-xl border-2 border-yellow-500/60 bg-gradient-to-br from-yellow-950/40 to-amber-950/30 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(234,179,8,0.12)" }}
    >
      {/* HIGH IMPACT header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-b border-yellow-500/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-yellow-600 text-white text-[10px] font-black tracking-wider uppercase">
            ⚡ High Impact
          </span>
          <Zap size={16} className="text-yellow-400" />
          <span className="text-sm font-bold text-yellow-300">
            Pattern Recognition Speed Drill
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!expanded && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            60-second drill: see a problem, identify the pattern in 10 seconds.
            Prioritizes your weak patterns automatically.
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 text-xs text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
          >
            Start drill →
          </button>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Why this matters */}
          <div className="flex gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle
              size={14}
              className="text-yellow-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-yellow-200">
              <strong>Why this matters:</strong> Pattern recognition speed is a
              leading indicator of coding interview performance. Candidates who
              can identify the right pattern within 30 seconds solve 2× more
              problems than those who can't.
            </p>
          </div>

          {/* Idle */}
          {phase === "idle" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-lg font-black text-yellow-400">8</div>
                  <div className="text-xs text-muted-foreground">Problems</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-lg font-black text-yellow-400">10s</div>
                  <div className="text-xs text-muted-foreground">
                    Per Question
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-lg font-black text-yellow-400">Auto</div>
                  <div className="text-xs text-muted-foreground">
                    Targets Weak Spots
                  </div>
                </div>
              </div>
              <button
                onClick={startDrill}
                className="w-full py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <Target size={14} />
                  Start Speed Drill
                </span>
              </button>
            </div>
          )}

          {/* Drilling */}
          {phase === "drilling" && currentProblem && (
            <div className="space-y-4">
              {/* Timers */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer size={14} className="text-yellow-400" />
                  <span className="text-sm font-mono text-yellow-300">
                    {totalTime}s left
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Q{currentIdx + 1}/{problems.length}
                </div>
                <div
                  className={`text-sm font-mono font-bold ${timeLeft <= 3 ? "text-red-400" : "text-yellow-300"}`}
                >
                  {timeLeft}s
                </div>
              </div>

              {/* Question timer bar */}
              <div className="w-full h-1.5 rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${timeLeft <= 3 ? "bg-red-500" : "bg-yellow-500"}`}
                  style={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }}
                />
              </div>

              {/* Problem */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-foreground leading-relaxed">
                  {currentProblem.problem}
                </p>
                {showHint && (
                  <p className="mt-2 text-xs text-yellow-400 italic">
                    Hint: {currentProblem.hint}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-2">
                {(
                  options[currentIdx] ??
                  getOptions(currentProblem.correctPattern)
                ).map(patternId => {
                  const pattern = PATTERNS.find(p => p.id === patternId);
                  if (!pattern) return null;
                  return (
                    <button
                      key={patternId}
                      onClick={() => {
                        if (questionTimerRef.current)
                          clearInterval(questionTimerRef.current);
                        advanceQuestion(patternId);
                      }}
                      className="p-3 rounded-lg bg-white/5 hover:bg-yellow-500/20 border border-white/10 hover:border-yellow-500/40 text-xs font-semibold text-foreground text-left transition-all"
                    >
                      {pattern.name}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowHint(true)}
                className="text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors"
              >
                Show hint (costs 3 seconds)
              </button>
            </div>
          )}

          {/* Done */}
          {phase === "done" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div
                    className={`text-xl font-black ${accuracy >= 80 ? "text-emerald-400" : accuracy >= 60 ? "text-amber-400" : "text-red-400"}`}
                  >
                    {accuracy}%
                  </div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xl font-black text-yellow-400">
                    {correctCount}/{results.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xl font-black text-blue-400">
                    {avgTime}s
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Time</div>
                </div>
              </div>

              {/* Verdict */}
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${accuracy >= 80 ? "bg-emerald-500/10 border border-emerald-500/20" : accuracy >= 60 ? "bg-amber-500/10 border border-amber-500/20" : "bg-red-500/10 border border-red-500/20"}`}
              >
                <Trophy
                  size={16}
                  className={
                    accuracy >= 80
                      ? "text-emerald-400"
                      : accuracy >= 60
                        ? "text-amber-400"
                        : "text-red-400"
                  }
                />
                <span className="text-sm font-bold">
                  {accuracy >= 80
                    ? "Strong pattern recognition — interview-ready"
                    : accuracy >= 60
                      ? "Developing — review missed patterns"
                      : "Needs work — focus on fundamentals first"}
                </span>
              </div>

              {/* Results breakdown */}
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-2 rounded-lg text-xs ${r.correct ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-red-500/5 border border-red-500/10"}`}
                  >
                    <span
                      className={`shrink-0 font-bold ${r.correct ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {r.correct ? "✓" : "✗"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground/70 truncate">{r.problem}</p>
                      {!r.correct && (
                        <p className="text-red-300 mt-0.5">
                          Correct:{" "}
                          {PATTERNS.find(p => p.id === r.correctPattern)?.name}
                          {r.selectedPattern !== "timeout" && (
                            <span className="text-muted-foreground">
                              {" "}
                              (you said:{" "}
                              {PATTERNS.find(p => p.id === r.selectedPattern)
                                ?.name ?? "timeout"}
                              )
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {r.timeUsed}s
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setPhase("idle");
                  setResults([]);
                }}
                className="flex items-center gap-2 w-full justify-center py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-muted-foreground hover:text-foreground transition-all"
              >
                <RefreshCw size={14} />
                Drill Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
