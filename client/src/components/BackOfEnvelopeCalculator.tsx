/**
 * #2 — Back-of-Envelope Calculator with "Show Your Work" Grading
 * Candidate types estimation steps in plain English.
 * AI grades: (a) math correctness, (b) reasonable assumptions, (c) connection to architecture.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  Calculator,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Lightbulb,
} from "lucide-react";

const EXAMPLE_PROBLEMS = [
  {
    title: "Design Instagram Feed",
    prompt:
      "Estimate QPS, storage per day, and bandwidth for a system serving 500M DAU where each user views 20 photos/day and posts 1 photo/week.",
  },
  {
    title: "Design a URL Shortener",
    prompt:
      "Estimate read QPS, write QPS, and 5-year storage for a URL shortener with 100M DAU, 1% write ratio, average URL length 100 bytes.",
  },
  {
    title: "Design WhatsApp",
    prompt:
      "Estimate message throughput, storage per year, and server count for 2B users sending 65B messages/day, average message 100 bytes.",
  },
  {
    title: "Design YouTube",
    prompt:
      "Estimate upload bandwidth, storage per day, and CDN cost for 500 hours of video uploaded per minute, average video 500MB.",
  },
  {
    title: "Design Twitter Timeline",
    prompt:
      "Estimate fanout write QPS and storage for 300M DAU, average 100 followers, 500M tweets/day, 140 chars each.",
  },
];

interface GradeResult {
  mathScore: number; // 1-5
  assumptionsScore: number; // 1-5
  architectureScore: number; // 1-5
  overallVerdict: string;
  mathFeedback: string;
  assumptionsFeedback: string;
  architectureFeedback: string;
  modelAnswer: string;
}

export function BackOfEnvelopeCalculator() {
  const [expanded, setExpanded] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(EXAMPLE_PROBLEMS[0]);
  const [customProblem, setCustomProblem] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [workings, setWorkings] = useState("");
  const [architectureDecision, setArchitectureDecision] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);

  const gradeMutation = trpc.ai.scoreBoECalculation.useMutation();

  async function handleGrade() {
    const problem = useCustom ? customProblem : selectedProblem.prompt;
    if (!problem.trim() || !workings.trim()) {
      toast.error("Fill in both the problem and your working steps");
      return;
    }
    try {
      const res = await gradeMutation.mutateAsync({
        problem,
        calculation: workings,
        result: architectureDecision || "See working steps",
        unit: "units",
      });
      setResult(JSON.parse(res.content) as GradeResult);
    } catch {
      toast.error("Grading failed — try again");
    }
  }

  function ScoreBar({
    label,
    score,
    feedback,
  }: {
    label: string;
    score: number;
    feedback: string;
  }) {
    const color =
      score >= 4
        ? "bg-emerald-500"
        : score >= 3
          ? "bg-amber-500"
          : "bg-red-500";
    const textColor =
      score >= 4
        ? "text-emerald-400"
        : score >= 3
          ? "text-amber-400"
          : "text-red-400";
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            {label}
          </span>
          <span className={`text-xs font-bold ${textColor}`}>{score}/5</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${color} transition-all`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{feedback}</p>
      </div>
    );
  }

  return (
    <div
      id="sd-boe-calculator"
      className="rounded-xl border-2 border-blue-500/60 bg-gradient-to-br from-blue-950/40 to-indigo-950/30 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(59,130,246,0.12)" }}
    >
      {/* HIGH IMPACT header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/10 border-b border-blue-500/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black tracking-wider uppercase">
            🎯 Very High Impact
          </span>
          <Calculator size={16} className="text-blue-400" />
          <span className="text-sm font-bold text-blue-300">
            Back-of-Envelope: Show Your Work
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!expanded && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            L6+ candidates who can't derive numbers on the fly and justify them
            fail immediately. Type your estimation steps — AI grades math,
            assumptions, and architectural connection.
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            Practice estimation →
          </button>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Why this matters */}
          <div className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <AlertTriangle
              size={14}
              className="text-blue-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-blue-200">
              <strong>Why this matters:</strong> The real bar at L6/L7 is
              whether you can derive numbers on the fly and connect them to
              architectural decisions. Candidates who can't do this fluently
              fail immediately at L6+.
            </p>
          </div>

          {/* Problem selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Estimation Problem
              </label>
              <button
                onClick={() => setUseCustom(u => !u)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {useCustom ? "← Use preset" : "Use custom →"}
              </button>
            </div>
            {useCustom ? (
              <textarea
                value={customProblem}
                onChange={e => setCustomProblem(e.target.value)}
                rows={3}
                placeholder="Describe the system and what to estimate..."
                className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground resize-none"
              />
            ) : (
              <select
                value={selectedProblem.title}
                onChange={e => {
                  const p = EXAMPLE_PROBLEMS.find(
                    ep => ep.title === e.target.value
                  );
                  if (p) setSelectedProblem(p);
                }}
                className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground"
              >
                {EXAMPLE_PROBLEMS.map(p => (
                  <option key={p.title} value={p.title}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
            {!useCustom && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-foreground/80">
                  {selectedProblem.prompt}
                </p>
              </div>
            )}
          </div>

          {/* Workings area */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Estimation Steps (plain English)
            </label>
            <div className="text-xs text-muted-foreground mb-1">
              Example:{" "}
              <span className="font-mono text-blue-300">
                "500M DAU × 20 photos/day = 10B photo views/day → ~116K QPS"
              </span>
            </div>
            <textarea
              value={workings}
              onChange={e => setWorkings(e.target.value)}
              rows={6}
              placeholder={
                "Step 1: ...\nStep 2: ...\nStep 3: ...\n\nConclusion: ..."
              }
              className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground resize-none font-mono"
            />
          </div>

          {/* Architecture connection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Architectural Decision (what do these numbers tell you?)
            </label>
            <textarea
              value={architectureDecision}
              onChange={e => setArchitectureDecision(e.target.value)}
              rows={2}
              placeholder="e.g. '116K QPS means we need a distributed cache — a single MySQL can't handle this...'"
              className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground resize-none"
            />
          </div>

          <button
            onClick={handleGrade}
            disabled={gradeMutation.isPending || !workings.trim()}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
          >
            {gradeMutation.isPending ? "Grading…" : "Grade My Estimation →"}
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              {/* Verdict */}
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${result.overallVerdict.toLowerCase().includes("strong") || result.overallVerdict.toLowerCase().includes("pass") ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}
              >
                {result.overallVerdict.toLowerCase().includes("strong") ||
                result.overallVerdict.toLowerCase().includes("pass") ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <XCircle size={16} className="text-amber-400" />
                )}
                <span className="text-sm font-bold text-foreground">
                  {result.overallVerdict}
                </span>
              </div>

              {/* Score bars */}
              <div className="space-y-3">
                <ScoreBar
                  label="Math Correctness"
                  score={result.mathScore}
                  feedback={result.mathFeedback}
                />
                <ScoreBar
                  label="Reasonable Assumptions"
                  score={result.assumptionsScore}
                  feedback={result.assumptionsFeedback}
                />
                <ScoreBar
                  label="Connected to Architecture"
                  score={result.architectureScore}
                  feedback={result.architectureFeedback}
                />
              </div>

              {/* Model answer */}
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
                <div className="flex items-center gap-1 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Lightbulb size={12} />
                  Model Answer
                </div>
                <Streamdown>{result.modelAnswer}</Streamdown>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setWorkings("");
                  setArchitectureDecision("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Try another problem →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
