/**
 * #3 — Tear Down My Design
 * Candidate submits a problem + design; AI plays a hostile senior engineer
 * and returns a full adversarial review with critical flaws, minor issues,
 * strengths, and prioritized fixes.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  Swords,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

type TargetLevel = "L4" | "L5" | "L6" | "L7";

interface TearDownResult {
  overallScore: number;
  verdict: string;
  criticalFlaws: Array<{ flaw: string; severity: string; fix: string }>;
  minorIssues: string[];
  strengths: string[];
  prioritizedFixes: string[];
}

export function TearDownMyDesign() {
  const [expanded, setExpanded] = useState(false);
  const [problem, setProblem] = useState("");
  const [designText, setDesignText] = useState("");
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("L6");
  const [result, setResult] = useState<TearDownResult | null>(null);

  const tearDownMutation = trpc.ai.tearDownDesign.useMutation();

  async function handleTearDown() {
    if (!problem.trim() || !designText.trim()) {
      toast.error("Fill in both the problem and your design");
      return;
    }
    try {
      const res = await tearDownMutation.mutateAsync({
        problem,
        design: designText,
        targetLevel,
      });
      const parsed = JSON.parse(res.content) as TearDownResult;
      setResult(parsed);
    } catch {
      toast.error("Failed to generate review — try again");
    }
  }

  function reset() {
    setResult(null);
    setProblem("");
    setDesignText("");
  }

  const scoreColor = !result
    ? ""
    : result.overallScore >= 8
      ? "text-emerald-400"
      : result.overallScore >= 6
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div
      id="sd-tear-down"
      className="rounded-xl border-2 border-purple-500/60 bg-gradient-to-br from-purple-950/40 to-violet-950/30 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(168,85,247,0.12)" }}
    >
      {/* HIGH IMPACT header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-violet-500/10 border-b border-purple-500/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black tracking-wider uppercase">
            🎯 Very High Impact
          </span>
          <Swords size={16} className="text-purple-400" />
          <span className="text-sm font-bold text-purple-300">
            Tear Down My Design
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!expanded && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Submit your design and an adversarial AI senior engineer fires
            brutal critiques. Builds the muscle for hostile interviewers.
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            Open →
          </button>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Why it matters */}
          <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={14}
                className="text-purple-400 mt-0.5 shrink-0"
              />
              <p className="text-xs text-purple-200/80">
                <span className="font-bold text-purple-300">
                  Why this matters:{" "}
                </span>
                L6/L7 interviewers routinely challenge your design mid-session.
                This drill trains you to defend under pressure without losing
                composure.
              </p>
            </div>
          </div>

          {!result ? (
            <div className="space-y-3">
              {/* Problem */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  System Design Problem
                </label>
                <input
                  value={problem}
                  onChange={e => setProblem(e.target.value)}
                  placeholder="e.g. Design a URL shortener for 100M users"
                  className="w-full rounded-lg bg-background/50 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Design */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Your Design (describe your approach)
                </label>
                <textarea
                  value={designText}
                  onChange={e => setDesignText(e.target.value)}
                  placeholder="Describe your architecture: components, data flow, storage choices, scaling strategy, trade-offs..."
                  rows={6}
                  className="w-full rounded-lg bg-background/50 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Target level */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Evaluate at level
                </label>
                <div className="flex gap-2">
                  {(["L4", "L5", "L6", "L7"] as TargetLevel[]).map(l => (
                    <button
                      key={l}
                      onClick={() => setTargetLevel(l)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        targetLevel === l
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "bg-background/30 border-border text-muted-foreground hover:border-purple-500/50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTearDown}
                disabled={tearDownMutation.isPending}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                {tearDownMutation.isPending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Tearing it down…
                  </>
                ) : (
                  <>
                    <Swords size={14} />
                    Tear It Down
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Score header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-3xl font-black ${scoreColor}`}>
                    {result.overallScore}/10
                  </span>
                  <span className="text-sm text-muted-foreground italic">
                    {result.verdict}
                  </span>
                </div>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-xs font-semibold transition-all"
                >
                  <RefreshCw size={12} /> New Design
                </button>
              </div>

              {/* Critical flaws */}
              {result.criticalFlaws.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <XCircle size={14} className="text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                      Critical Flaws ({result.criticalFlaws.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {result.criticalFlaws.map((f, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-red-500/10 border border-red-500/20 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 shrink-0 mt-0.5">
                            {f.severity.toUpperCase()}
                          </span>
                          <div className="space-y-1">
                            <p className="text-xs text-red-200">{f.flaw}</p>
                            <p className="text-xs text-emerald-300">
                              <span className="font-semibold">Fix: </span>
                              {f.fix}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Minor issues */}
              {result.minorIssues.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info size={14} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Minor Issues
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {result.minorIssues.map((issue, i) => (
                      <li
                        key={i}
                        className="text-xs text-amber-200/80 flex items-start gap-1.5"
                      >
                        <span className="text-amber-400 mt-0.5">·</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Strengths
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-emerald-200/80 flex items-start gap-1.5"
                      >
                        <span className="text-emerald-400 mt-0.5">·</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prioritized fixes */}
              {result.prioritizedFixes.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Prioritized Action Plan
                  </p>
                  <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
                    <Streamdown>
                      {result.prioritizedFixes.join("\n")}
                    </Streamdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
