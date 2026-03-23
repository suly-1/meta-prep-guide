/**
 * #4 — Think Out Loud Coaching Mode
 * Candidate narrates their coding approach in plain text.
 * AI evaluates communication quality, not just correctness.
 * Scores: problem decomposition, assumption clarification, trade-off articulation, edge case coverage.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Mic,
  RefreshCw,
} from "lucide-react";
import { PATTERNS } from "@/lib/data";

const CODING_PROBLEMS = [
  {
    id: "lru",
    title: "LRU Cache",
    difficulty: "Medium",
    prompt:
      "Design and implement a data structure for Least Recently Used (LRU) cache. It should support get(key) and put(key, value) in O(1) time.",
    pattern: "Hash Map + Doubly Linked List",
  },
  {
    id: "word-break",
    title: "Word Break II",
    difficulty: "Hard",
    prompt:
      "Given a string s and a dictionary of strings wordDict, add spaces in s to construct a sentence where each word is a valid dictionary word. Return all such possible sentences.",
    pattern: "Dynamic Programming + Backtracking",
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    prompt:
      "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.",
    pattern: "Sorting + Greedy",
  },
  {
    id: "serialize-tree",
    title: "Serialize and Deserialize Binary Tree",
    difficulty: "Hard",
    prompt:
      "Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work.",
    pattern: "BFS / DFS",
  },
  {
    id: "kth-largest",
    title: "Kth Largest Element in a Stream",
    difficulty: "Easy",
    prompt:
      "Design a class to find the kth largest element in a stream. Note that it is the kth largest element in the sorted order, not the kth distinct element.",
    pattern: "Heap",
  },
  {
    id: "alien-dict",
    title: "Alien Dictionary",
    difficulty: "Hard",
    prompt:
      "Given a list of words from the alien language's dictionary, derive the order of letters in this language. Return the correct order as a string.",
    pattern: "Topological Sort",
  },
];

interface CommunicationScore {
  problemDecomposition: number; // 1-5
  assumptionClarification: number; // 1-5
  tradeOffArticulation: number; // 1-5
  edgeCaseCoverage: number; // 1-5
  overallCommunication: number; // 1-5
  verdict: string;
  strengths: string[];
  improvements: string[];
  modelNarration: string;
}

export function ThinkOutLoudCoach() {
  const [expanded, setExpanded] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(CODING_PROBLEMS[0]);
  const [narration, setNarration] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CommunicationScore | null>(null);

  const scoreMutation = trpc.ai.scoreThinkOutLoud.useMutation();

  async function handleScore() {
    if (!narration.trim()) {
      toast.error("Add your verbal narration first");
      return;
    }
    try {
      const res = await scoreMutation.mutateAsync({
        problem: selectedProblem.prompt,
        transcript: narration,
      });
      setResult(JSON.parse(res.content) as CommunicationScore);
    } catch {
      toast.error("Scoring failed — try again");
    }
  }

  function ScorePill({ label, score }: { label: string; score: number }) {
    const color =
      score >= 4
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        : score >= 3
          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
          : "bg-red-500/20 text-red-400 border-red-500/30";
    return (
      <div
        className={`flex flex-col items-center px-3 py-2 rounded-lg border ${color}`}
      >
        <span className="text-xs font-bold">{score}/5</span>
        <span className="text-[10px] text-center leading-tight mt-0.5">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      id="coding-think-out-loud"
      className="rounded-xl border-2 border-cyan-500/60 bg-gradient-to-br from-cyan-950/40 to-teal-950/30 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(6,182,212,0.12)" }}
    >
      {/* HIGH IMPACT header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-black tracking-wider uppercase">
            🎯 Very High Impact
          </span>
          <Mic size={16} className="text-cyan-400" />
          <span className="text-sm font-bold text-cyan-300">
            Think Out Loud Coaching Mode
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!expanded && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            At L6+, communication IS the interview. AI scores your verbal
            reasoning — not just whether your code is correct.
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            Practice narration →
          </button>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Why this matters */}
          <div className="flex gap-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <AlertTriangle
              size={14}
              className="text-cyan-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-cyan-200">
              <strong>Why this matters:</strong> At L6+, a silent candidate who
              writes perfect code still fails. Interviewers are explicitly
              evaluating your communication, problem decomposition, and
              trade-off reasoning — not just correctness.
            </p>
          </div>

          {/* Problem selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Problem
            </label>
            <select
              value={selectedProblem.id}
              onChange={e => {
                const p = CODING_PROBLEMS.find(cp => cp.id === e.target.value);
                if (p) setSelectedProblem(p);
              }}
              className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground"
            >
              {CODING_PROBLEMS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.difficulty}) — {p.pattern}
                </option>
              ))}
            </select>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-foreground/80">
                {selectedProblem.prompt}
              </p>
            </div>
          </div>

          {/* Narration area */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Verbal Narration (type what you'd say out loud)
            </label>
            <div className="text-xs text-muted-foreground mb-1">
              Include: clarifying questions, your approach, why you chose it,
              trade-offs, edge cases you considered.
            </div>
            <textarea
              value={narration}
              onChange={e => setNarration(e.target.value)}
              rows={7}
              placeholder={
                "\"Okay, so first let me make sure I understand the problem...\n\nI'm thinking about this as a [pattern] problem because...\n\nBefore I code, let me clarify: does the cache need to be thread-safe?\n\nMy approach: I'll use a doubly linked list + hash map because...\n\nThe trade-off here is [X] vs [Y] — I'm choosing X because...\n\nEdge cases I need to handle: empty cache, single element, duplicate keys...\"\n\n(Write your full narration here)"
              }
              className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground resize-none"
            />
          </div>

          {/* Optional code */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Code (optional — paste your solution)
            </label>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              rows={4}
              placeholder="Paste your code here (optional — narration is what's being graded)"
              className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground resize-none font-mono"
            />
          </div>

          <button
            onClick={handleScore}
            disabled={scoreMutation.isPending || !narration.trim()}
            className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
          >
            {scoreMutation.isPending
              ? "Analyzing communication…"
              : "Score My Communication →"}
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              {/* Score grid */}
              <div className="grid grid-cols-5 gap-2">
                <ScorePill
                  label="Problem Decomp"
                  score={result.problemDecomposition}
                />
                <ScorePill
                  label="Assumptions"
                  score={result.assumptionClarification}
                />
                <ScorePill
                  label="Trade-offs"
                  score={result.tradeOffArticulation}
                />
                <ScorePill label="Edge Cases" score={result.edgeCaseCoverage} />
                <ScorePill
                  label="Overall"
                  score={result.overallCommunication}
                />
              </div>

              {/* Verdict */}
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm font-bold text-foreground">
                  {result.verdict}
                </p>
              </div>

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Strengths
                  </div>
                  {result.strengths.map((s, i) => (
                    <div
                      key={i}
                      className="flex gap-2 text-xs text-foreground/80"
                    >
                      <span className="text-emerald-400 shrink-0">✓</span>
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Improvements */}
              {result.improvements.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    To Improve
                  </div>
                  {result.improvements.map((s, i) => (
                    <div
                      key={i}
                      className="flex gap-2 text-xs text-foreground/80"
                    >
                      <span className="text-amber-400 shrink-0">→</span>
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Model narration */}
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
                <div className="flex items-center gap-1 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <MessageSquare size={12} />
                  Model Narration (L6 Standard)
                </div>
                <Streamdown>{result.modelNarration}</Streamdown>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setNarration("");
                  setCode("");
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={12} />
                Try another problem
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
