/**
 * #6 — Personalized Weak Pattern Remediation Plan
 * Reads the candidate's pattern ratings from localStorage,
 * identifies the 3 weakest, and generates a targeted 5-day study plan with
 * specific problems, resources, and daily time estimates.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { usePatternRatings } from "@/hooks/useLocalStorage";
import { PATTERNS } from "@/lib/data";
import {
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BookOpen,
  TrendingUp,
} from "lucide-react";

export function WeakPatternRemediationPlan() {
  const [expanded, setExpanded] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [patternRatings] = usePatternRatings();

  const planMutation = trpc.ai.generateRemediationPlan.useMutation();

  // Compute weak patterns (rated 0-2)
  const weakPatterns = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) <= 2
  ).sort((a, b) => (patternRatings[a.id] ?? 0) - (patternRatings[b.id] ?? 0));

  const top3Weak = weakPatterns.slice(0, 3);
  const allRated = PATTERNS.filter(p => patternRatings[p.id] !== undefined);
  const avgRating =
    allRated.length > 0
      ? allRated.reduce((a, p) => a + (patternRatings[p.id] ?? 0), 0) /
        allRated.length
      : null;

  async function generatePlan() {
    if (top3Weak.length === 0) {
      toast.info(
        "No weak patterns found — rate your patterns first in the Coding tab"
      );
      return;
    }
    try {
      const res = await planMutation.mutateAsync({
        weakPatterns: top3Weak.map(p => ({
          id: p.id,
          name: p.name,
          rating: patternRatings[p.id] ?? 0,
        })),
        daysAvailable: 7,
      });
      setPlan(res.content);
    } catch {
      toast.error("Failed to generate plan — try again");
    }
  }

  function ratingLabel(r: number) {
    if (r === 0) return { label: "Not rated", color: "text-muted-foreground" };
    if (r === 1) return { label: "Never seen it", color: "text-red-400" };
    if (r === 2) return { label: "Struggling", color: "text-red-400" };
    if (r === 3) return { label: "Getting there", color: "text-amber-400" };
    if (r === 4) return { label: "Comfortable", color: "text-emerald-400" };
    return { label: "Mastered", color: "text-emerald-400" };
  }

  return (
    <div
      id="coding-remediation-plan"
      className="rounded-xl border-2 border-rose-500/60 bg-gradient-to-br from-rose-950/40 to-pink-950/30 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(244,63,94,0.12)" }}
    >
      {/* HIGH IMPACT header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-500/20 to-pink-500/10 border-b border-rose-500/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase">
            ⚡ High Impact
          </span>
          <Target size={16} className="text-rose-400" />
          <span className="text-sm font-bold text-rose-300">
            Personalized Weak Pattern Remediation Plan
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-rose-400 hover:text-rose-300 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!expanded && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Based on your pattern ratings, generates a targeted 5-day study plan
            for your 3 weakest patterns with specific problems and daily time
            estimates.
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
          >
            Generate my plan →
          </button>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Why this matters */}
          <div className="flex gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle
              size={14}
              className="text-rose-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-rose-200">
              <strong>Why this matters:</strong> Generic study plans waste time.
              This plan targets exactly the patterns where you're most likely to
              fail — the ones you've rated as weak — and gives you a concrete
              daily schedule to fix them before your interview.
            </p>
          </div>

          {/* Current state snapshot */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Your Pattern Snapshot
              </div>
              {avgRating !== null && (
                <div className="text-xs text-muted-foreground">
                  Overall avg:{" "}
                  <span
                    className={`font-bold ${avgRating >= 4 ? "text-emerald-400" : avgRating >= 3 ? "text-amber-400" : "text-red-400"}`}
                  >
                    {avgRating.toFixed(1)}/5
                  </span>
                </div>
              )}
            </div>

            {top3Weak.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                No weak patterns detected — rate your patterns in the Coding tab
                first, or all patterns are rated ≥3.
              </div>
            ) : (
              <div className="space-y-2">
                {top3Weak.map((p, i) => {
                  const rating = patternRatings[p.id] ?? 0;
                  const { label, color } = ratingLabel(rating);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/10 border border-red-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-red-400 font-bold">
                          #{i + 1}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {p.keyIdea}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${color}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Generate button */}
          {!plan && (
            <button
              onClick={generatePlan}
              disabled={planMutation.isPending || top3Weak.length === 0}
              className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
            >
              {planMutation.isPending
                ? "Building your plan…"
                : "Generate My 5-Day Plan →"}
            </button>
          )}

          {/* Plan output */}
          {plan && (
            <div className="space-y-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} className="text-rose-400" />
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Your Personalized 5-Day Plan
                  </div>
                </div>
                <Streamdown>{plan}</Streamdown>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp size={14} className="text-emerald-400" />
                <p className="text-xs text-emerald-200">
                  After completing this plan, re-rate your patterns to see your
                  progress and get an updated plan.
                </p>
              </div>

              <button
                onClick={() => setPlan(null)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={12} />
                Regenerate plan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
