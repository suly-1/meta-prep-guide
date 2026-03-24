/**
 * Complexity Proof Trainer
 * Candidate states their solution's complexity, then must PROVE it.
 * AI evaluates the reasoning chain, not just the answer.
 * Closes the 20% rejection rate from wrong/unproven complexity claims.
 */
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
} from "lucide-react";

interface ProofResult {
  complexityCorrect: boolean;
  proofQuality: string;
  actualTimeComplexity: string;
  actualSpaceComplexity: string;
  mistakesFound: string[];
  strengths: string[];
  modelProof: string;
  followUpQuestion: string;
}

const SAMPLE_PROBLEMS = [
  {
    title: "Two Sum (Hash Map)",
    solution:
      "Use a hash map. For each element, check if target-element exists in the map. If yes, return indices. Otherwise, add element to map.",
    time: "O(n)",
    space: "O(n)",
  },
  {
    title: "Merge Sort",
    solution:
      "Recursively divide array in half, sort each half, then merge. Merge takes O(n) and we have O(log n) levels of recursion.",
    time: "O(n log n)",
    space: "O(n)",
  },
  {
    title: "LRU Cache (get/put)",
    solution:
      "Use a doubly linked list + hash map. get() and put() both do O(1) operations: hash map lookup + list node move to front.",
    time: "O(1)",
    space: "O(capacity)",
  },
  {
    title: "Binary Search",
    solution:
      "Divide search space in half each iteration. Start with n elements, then n/2, n/4... until 1 element remains.",
    time: "O(log n)",
    space: "O(1)",
  },
  {
    title: "DFS on a Graph",
    solution:
      "Visit each node once and each edge once. Use a visited set to avoid cycles.",
    time: "O(V + E)",
    space: "O(V)",
  },
];

const QUALITY_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  strong: {
    color: "text-emerald-400",
    icon: <CheckCircle2 size={16} className="text-emerald-400" />,
    label: "Strong Proof",
  },
  adequate: {
    color: "text-blue-400",
    icon: <CheckCircle2 size={16} className="text-blue-400" />,
    label: "Adequate",
  },
  weak: {
    color: "text-amber-400",
    icon: <AlertTriangle size={16} className="text-amber-400" />,
    label: "Weak Proof",
  },
  incorrect: {
    color: "text-red-400",
    icon: <XCircle size={16} className="text-red-400" />,
    label: "Incorrect",
  },
};

export function ComplexityProofTrainer() {
  const [expanded, setExpanded] = useState(false);
  const [problemTitle, setProblemTitle] = useState("");
  const [solutionDescription, setSolutionDescription] = useState("");
  const [claimedTime, setClaimedTime] = useState("");
  const [claimedSpace, setClaimedSpace] = useState("");
  const [candidateProof, setCandidateProof] = useState("");
  const [result, setResult] = useState<ProofResult | null>(null);

  const challengeMutation = trpc.ai.challengeComplexity.useMutation({
    onSuccess: data => {
      try {
        const parsed = JSON.parse(data.content) as ProofResult;
        setResult(parsed);
      } catch {
        toast.error("Failed to parse result");
      }
    },
    onError: () => toast.error("Challenge failed — please try again"),
  });

  const loadSample = (idx: number) => {
    const s = SAMPLE_PROBLEMS[idx];
    setProblemTitle(s.title);
    setSolutionDescription(s.solution);
    setClaimedTime(s.time);
    setClaimedSpace(s.space);
    setCandidateProof("");
    setResult(null);
  };

  const handleSubmit = () => {
    if (!problemTitle || !candidateProof.trim()) {
      toast.error("Please fill in the problem, solution, and your proof");
      return;
    }
    setResult(null);
    challengeMutation.mutate({
      problemTitle,
      solutionDescription,
      claimedTimeComplexity: claimedTime,
      claimedSpaceComplexity: claimedSpace,
      candidateProof,
    });
  };

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-500/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Calculator size={16} className="text-blue-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground">
              Complexity Proof Trainer
            </div>
            <div className="text-xs text-muted-foreground">
              Don't just state O(n log n) — prove it. Interviewers always ask.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
            20% Rejection Fix
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-blue-500/20">
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            Meta interviewers specifically probe complexity. Saying "O(n log n)"
            is not enough — you need to walk through the reasoning. This trainer
            evaluates your proof, not just your answer.
          </div>

          {/* Sample problems */}
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-2">
              Load a sample problem:
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROBLEMS.map((p, i) => (
                <button
                  key={p.title}
                  onClick={() => loadSample(i)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-border hover:border-blue-500/40 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-300 transition-all"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Problem + solution */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Problem Title
              </label>
              <input
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                placeholder="e.g. LRU Cache"
                value={problemTitle}
                onChange={e => setProblemTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Solution Description
              </label>
              <textarea
                className="w-full h-20 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                placeholder="Briefly describe your approach..."
                value={solutionDescription}
                onChange={e => setSolutionDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Complexity claims */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Claimed Time Complexity
              </label>
              <input
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                placeholder="O(n log n)"
                value={claimedTime}
                onChange={e => setClaimedTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Claimed Space Complexity
              </label>
              <input
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                placeholder="O(n)"
                value={claimedSpace}
                onChange={e => setClaimedSpace(e.target.value)}
              />
            </div>
          </div>

          {/* Proof */}
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">
              Your Proof — walk through WHY this complexity is correct
            </label>
            <textarea
              className="w-full h-32 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. 'The outer loop runs n times. The inner hash map lookup is O(1) amortized. Therefore the total is O(n). Space is O(n) because in the worst case we store all n elements in the hash map before finding the pair...'"
              value={candidateProof}
              onChange={e => setCandidateProof(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              challengeMutation.isPending ||
              !problemTitle ||
              !candidateProof.trim()
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {challengeMutation.isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Calculator size={14} />
            )}
            {challengeMutation.isPending
              ? "Evaluating proof..."
              : "Challenge My Proof"}
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-4 pt-2">
              {/* Verdict header */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/30">
                <div>
                  {QUALITY_CONFIG[result.proofQuality]?.icon ?? (
                    <AlertTriangle size={16} />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`font-semibold ${QUALITY_CONFIG[result.proofQuality]?.color ?? "text-foreground"}`}
                  >
                    {QUALITY_CONFIG[result.proofQuality]?.label ??
                      result.proofQuality}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {result.complexityCorrect ? (
                      <span className="text-emerald-400">
                        ✓ Complexity claim is correct (
                        {result.actualTimeComplexity} time,{" "}
                        {result.actualSpaceComplexity} space)
                      </span>
                    ) : (
                      <span className="text-red-400">
                        ✗ Actual complexity: {result.actualTimeComplexity} time,{" "}
                        {result.actualSpaceComplexity} space
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mistakes */}
              {result.mistakesFound.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-xs font-semibold text-red-400 mb-2">
                    Mistakes Found
                  </div>
                  <ul className="space-y-1">
                    {result.mistakesFound.map((m, i) => (
                      <li
                        key={i}
                        className="text-xs text-red-300 flex items-start gap-2"
                      >
                        <XCircle size={12} className="mt-0.5 shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xs font-semibold text-emerald-400 mb-2">
                    Strengths
                  </div>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-emerald-300 flex items-start gap-2"
                      >
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up question */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                  <Lightbulb size={12} />
                  Interviewer Follow-Up
                </div>
                <p className="text-sm text-amber-200 italic">
                  "{result.followUpQuestion}"
                </p>
              </div>

              {/* Model proof */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Model Proof (how to prove it correctly)
                </div>
                <div className="text-sm prose prose-invert prose-sm max-w-none">
                  <Streamdown>{result.modelProof}</Streamdown>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
