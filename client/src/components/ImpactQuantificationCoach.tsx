/**
 * #9 — Impact Quantification Coach
 * Candidate pastes a STAR story. AI identifies every claim that could be
 * quantified and coaches them to add specific numbers, percentages, and metrics.
 * Returns a strengthened version of the story.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export function ImpactQuantificationCoach() {
  const [expanded, setExpanded] = useState(false);
  const [story, setStory] = useState("");
  const [result, setResult] = useState<{
    weakClaims: Array<{ original: string; suggestion: string }>;
    strengthenedStory: string;
    scoreOriginal: number;
    scoreStrengthened: number;
    coaching: string;
  } | null>(null);

  const coachMutation = trpc.ai.quantifyImpact.useMutation();

  async function handleCoach() {
    if (!story.trim()) {
      toast.error("Paste your STAR story first");
      return;
    }
    try {
      const res = await coachMutation.mutateAsync({ story });
      setResult(JSON.parse(res.content));
    } catch {
      toast.error("Coaching failed — try again");
    }
  }

  return (
    <div
      id="behavioral-impact-coach"
      className="rounded-xl border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-950/40 to-green-950/30 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(16,185,129,0.12)" }}
    >
      {/* HIGH IMPACT header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500/20 to-green-500/10 border-b border-emerald-500/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase">
            ⚡ High Impact
          </span>
          <TrendingUp size={16} className="text-emerald-400" />
          <span className="text-sm font-bold text-emerald-300">
            Impact Quantification Coach
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!expanded && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Paste any STAR story. AI finds every vague claim and coaches you to
            add specific metrics — the single biggest differentiator between L5
            and L6 stories.
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            Strengthen my story →
          </button>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Why this matters */}
          <div className="flex gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <AlertTriangle
              size={14}
              className="text-emerald-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-emerald-200">
              <strong>Why this matters:</strong> "I improved performance" is an
              L4 answer. "I reduced P99 latency from 800ms to 120ms, cutting
              timeout errors by 94% and saving $2M/year in SLA penalties" is an
              L6 answer. The difference is quantification.
            </p>
          </div>

          {/* Input */}
          {!result && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your STAR Story
                </label>
                <div className="text-xs text-muted-foreground">
                  Paste any behavioral answer — rough draft is fine. The coach
                  will find every place you can add numbers.
                </div>
                <textarea
                  value={story}
                  onChange={e => setStory(e.target.value)}
                  rows={10}
                  placeholder={
                    'Example (weak):\n"I led a project to improve our checkout flow. The team was struggling with performance issues and I worked with engineers to fix the bottlenecks. We made significant improvements and the business saw better results. Customers were happier and conversion improved."\n\nPaste your story here...'
                  }
                  className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground resize-none"
                />
              </div>

              <button
                onClick={handleCoach}
                disabled={coachMutation.isPending || !story.trim()}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
              >
                {coachMutation.isPending
                  ? "Analyzing story…"
                  : "Quantify My Impact →"}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Score improvement */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                  <div className="text-2xl font-black text-red-400">
                    {result.scoreOriginal}/10
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Original Impact Score
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-2xl font-black text-emerald-400">
                    {result.scoreStrengthened}/10
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Strengthened Score
                  </div>
                </div>
              </div>

              {/* Weak claims */}
              {result.weakClaims.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Vague Claims to Quantify ({result.weakClaims.length})
                  </div>
                  {result.weakClaims.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 space-y-1.5"
                    >
                      <div className="text-xs text-red-300 line-through">
                        "{c.original}"
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Sparkles
                          size={10}
                          className="text-emerald-400 shrink-0 mt-0.5"
                        />
                        <div className="text-xs text-emerald-300">
                          {c.suggestion}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Coaching */}
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Coaching Notes
                </div>
                <Streamdown>{result.coaching}</Streamdown>
              </div>

              {/* Strengthened story */}
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Sparkles size={12} />
                  Strengthened Story (L6 Standard)
                </div>
                <Streamdown>{result.strengthenedStory}</Streamdown>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setStory("");
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={12} />
                Coach another story
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
