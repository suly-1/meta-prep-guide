/**
 * Post-Interview Debrief Form + AI Analysis
 * Structured debrief after any real or mock interview.
 * AI returns: likely outcome, top failure points, prioritized fix list.
 * Closes the feedback loop so candidates don't repeat the same mistakes.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from "lucide-react";

type RoundType = "coding" | "system_design" | "behavioral" | "full_loop";

interface DebriefResult {
  likelyOutcome: string;
  topFailurePoints: string[];
  fixList: Array<{ title: string; action: string }>;
  strengths: string[];
  coaching: string;
}

const OUTCOME_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  strong_hire: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    label: "Strong Hire",
  },
  hire: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    label: "Hire",
  },
  borderline: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    label: "Borderline",
  },
  no_hire: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    label: "No Hire",
  },
};

export function PostInterviewDebrief() {
  const [expanded, setExpanded] = useState(false);
  const [roundType, setRoundType] = useState<RoundType>("coding");
  const [targetLevel, setTargetLevel] = useState("L6");
  const [selfScore, setSelfScore] = useState(3);
  const [questionsAsked, setQuestionsAsked] = useState("");
  const [approachTaken, setApproachTaken] = useState("");
  const [uncertainMoments, setUncertainMoments] = useState("");
  const [interviewerReactions, setInterviewerReactions] = useState("");
  const [result, setResult] = useState<DebriefResult | null>(null);

  const analyzeMutation = trpc.ai.analyzeDebrief.useMutation({
    onSuccess: data => {
      try {
        const parsed = JSON.parse(data.content) as DebriefResult;
        setResult(parsed);
      } catch {
        toast.error("Failed to parse debrief analysis");
      }
    },
    onError: () => toast.error("Analysis failed — please try again"),
  });

  const handleSubmit = () => {
    if (!questionsAsked.trim() || !approachTaken.trim()) {
      toast.error(
        "Please fill in at least the questions asked and your approach"
      );
      return;
    }
    setResult(null);
    analyzeMutation.mutate({
      roundType,
      targetLevel,
      selfScore,
      questionsAsked,
      approachTaken,
      uncertainMoments,
      interviewerReactions,
    });
  };

  const outcomeConfig = result ? OUTCOME_CONFIG[result.likelyOutcome] : null;

  return (
    <div className="rounded-xl border border-slate-500/30 bg-slate-500/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-500/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center">
            <ClipboardList size={16} className="text-slate-300" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground">
              Post-Interview Debrief
            </div>
            <div className="text-xs text-muted-foreground">
              Log what happened. Get a prioritized fix list before your next
              attempt.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 font-medium">
            Close the Loop
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-500/20">
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            Candidates who fail interviews often don't know why — and repeat the
            same mistakes. Fill this in immediately after any real or mock
            interview for an honest AI debrief.
          </div>

          {/* Round type + level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Round Type
              </label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                value={roundType}
                onChange={e => setRoundType(e.target.value as RoundType)}
              >
                <option value="coding">Coding</option>
                <option value="system_design">System Design</option>
                <option value="behavioral">Behavioral</option>
                <option value="full_loop">Full Loop</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Target Level
              </label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                value={targetLevel}
                onChange={e => setTargetLevel(e.target.value)}
              >
                {["L4", "L5", "L6", "L7"].map(l => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Self score */}
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-2">
              How did it go? (1 = disaster, 5 = nailed it)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setSelfScore(s)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-all ${
                    selfScore === s
                      ? s <= 2
                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                        : s === 3
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "border-border text-muted-foreground hover:border-blue-500/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Questions asked */}
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">
              What questions were asked?
            </label>
            <textarea
              className="w-full h-20 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. 'Design a rate limiter. Follow-up: how would you handle distributed rate limiting?'"
              value={questionsAsked}
              onChange={e => setQuestionsAsked(e.target.value)}
            />
          </div>

          {/* Approach */}
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">
              What approach did you take?
            </label>
            <textarea
              className="w-full h-24 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="Describe your approach, what you solved, what you didn't finish..."
              value={approachTaken}
              onChange={e => setApproachTaken(e.target.value)}
            />
          </div>

          {/* Uncertain moments */}
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">
              Where did you feel uncertain or stuck?
            </label>
            <textarea
              className="w-full h-20 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. 'Got stuck on the distributed consistency follow-up. Wasn't sure about the complexity proof.'"
              value={uncertainMoments}
              onChange={e => setUncertainMoments(e.target.value)}
            />
          </div>

          {/* Interviewer reactions */}
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">
              How did the interviewer react? (optional)
            </label>
            <textarea
              className="w-full h-16 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. 'Seemed satisfied with the initial design but pushed hard on scalability. Gave hints on the DP problem.'"
              value={interviewerReactions}
              onChange={e => setInterviewerReactions(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              analyzeMutation.isPending ||
              !questionsAsked.trim() ||
              !approachTaken.trim()
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {analyzeMutation.isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <ClipboardList size={14} />
            )}
            {analyzeMutation.isPending ? "Analyzing..." : "Analyze My Debrief"}
          </button>

          {/* Results */}
          {result && outcomeConfig && (
            <div className="space-y-4 pt-2">
              {/* Likely outcome */}
              <div
                className={`p-4 rounded-xl border ${outcomeConfig.border} ${outcomeConfig.bg} flex items-center gap-3`}
              >
                <div className={`text-2xl font-bold ${outcomeConfig.color}`}>
                  {outcomeConfig.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  Likely outcome based on your debrief signals
                </div>
              </div>

              {/* Failure points */}
              {result.topFailurePoints.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-xs font-semibold text-red-400 mb-2">
                    Top Failure Points Identified
                  </div>
                  <ul className="space-y-1">
                    {result.topFailurePoints.map((f, i) => (
                      <li
                        key={i}
                        className="text-xs text-red-300 flex items-start gap-2"
                      >
                        <XCircle size={12} className="mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fix list */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground">
                  Your 3 Priorities Before Next Attempt
                </div>
                {result.fixList.map((fix, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {fix.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <ArrowRight size={10} />
                        {fix.action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xs font-semibold text-emerald-400 mb-2">
                    What You Did Well
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

              {/* Coaching */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Detailed Coaching
                </div>
                <div className="text-sm prose prose-invert prose-sm max-w-none">
                  <Streamdown>{result.coaching}</Streamdown>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
