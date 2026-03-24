/**
 * Seniority Level Calibrator
 * Candidate pastes a STAR story + selects target level.
 * AI returns a "Level Signal" badge (L4-L7) with a specific rewrite suggestion.
 * Closes the #1 down-leveling failure mode: L6/L7 candidates telling L5 stories.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpCircle,
} from "lucide-react";

type TargetLevel = "L4" | "L5" | "L6" | "L7";

interface CalibrationResult {
  detectedLevel: string;
  scopeSignal: string;
  ambiguitySignal: string;
  influenceSignal: string;
  driverSignal: string;
  rewriteSuggestion: string;
  coaching: string;
}

const LEVEL_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  L4: {
    bg: "bg-slate-500/20",
    text: "text-slate-300",
    border: "border-slate-500/40",
  },
  L5: {
    bg: "bg-blue-500/20",
    text: "text-blue-300",
    border: "border-blue-500/40",
  },
  L6: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-300",
    border: "border-emerald-500/40",
  },
  L7: {
    bg: "bg-purple-500/20",
    text: "text-purple-300",
    border: "border-purple-500/40",
  },
};

const SIGNAL_ICON = (signal: string) => {
  if (signal === "strong")
    return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (signal === "weak")
    return <AlertTriangle size={14} className="text-amber-400" />;
  return <XCircle size={14} className="text-red-400" />;
};

const SIGNAL_COLOR = (signal: string) =>
  signal === "strong"
    ? "text-emerald-400"
    : signal === "weak"
      ? "text-amber-400"
      : "text-red-400";

export function SeniorityLevelCalibrator() {
  const [expanded, setExpanded] = useState(false);
  const [story, setStory] = useState("");
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("L6");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<CalibrationResult | null>(null);

  const calibrateMutation = trpc.ai.calibrateSeniorityLevel.useMutation({
    onSuccess: data => {
      try {
        const parsed = JSON.parse(data.content) as CalibrationResult;
        setResult(parsed);
      } catch {
        toast.error("Failed to parse calibration result");
      }
    },
    onError: () => toast.error("Calibration failed — please try again"),
  });

  const handleSubmit = () => {
    if (story.trim().length < 100) {
      toast.error("Please paste a STAR story of at least 100 characters");
      return;
    }
    setResult(null);
    calibrateMutation.mutate({
      story,
      targetLevel,
      question: question || undefined,
    });
  };

  const levelMatch =
    result &&
    (result.detectedLevel === targetLevel
      ? "match"
      : parseInt(result.detectedLevel.replace("L", "")) <
          parseInt(targetLevel.replace("L", ""))
        ? "below"
        : "above");

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-purple-500/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <TrendingUp size={16} className="text-purple-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground">
              Seniority Level Calibrator
            </div>
            <div className="text-xs text-muted-foreground">
              Are you telling L5 stories for an L6 role? Find out instantly.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
            #1 Down-Level Fix
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-purple-500/20">
          {/* Explainer */}
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <strong>22% of L6/L7 rejections</strong> happen because the
            candidate's stories read at the wrong seniority level. This tool
            detects the gap and tells you exactly how to fix it.
          </div>

          {/* Target level selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              Target Level:
            </label>
            <div className="flex gap-2">
              {(["L4", "L5", "L6", "L7"] as TargetLevel[]).map(l => (
                <button
                  key={l}
                  onClick={() => setTargetLevel(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    targetLevel === l
                      ? `${LEVEL_COLORS[l].bg} ${LEVEL_COLORS[l].text} ${LEVEL_COLORS[l].border}`
                      : "border-border text-muted-foreground hover:border-purple-500/40"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Optional question */}
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">
              Interview Question (optional)
            </label>
            <input
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              placeholder='e.g. "Tell me about a time you drove a major technical decision"'
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>

          {/* Story input */}
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">
              Your STAR Story
            </label>
            <textarea
              className="w-full h-40 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              placeholder="Paste your full STAR story here (Situation, Task, Action, Result)..."
              value={story}
              onChange={e => setStory(e.target.value)}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {story.length} characters
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={calibrateMutation.isPending || story.length < 100}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {calibrateMutation.isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <TrendingUp size={14} />
            )}
            {calibrateMutation.isPending
              ? "Calibrating..."
              : "Calibrate My Story"}
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-4 pt-2">
              {/* Level badge */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/30">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Detected Level
                  </div>
                  <div
                    className={`text-2xl font-bold px-4 py-2 rounded-xl border ${LEVEL_COLORS[result.detectedLevel]?.bg ?? "bg-slate-500/20"} ${LEVEL_COLORS[result.detectedLevel]?.text ?? "text-slate-300"} ${LEVEL_COLORS[result.detectedLevel]?.border ?? "border-slate-500/40"}`}
                  >
                    {result.detectedLevel}
                  </div>
                </div>
                <div className="flex-1">
                  {levelMatch === "match" && (
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle2 size={18} />
                      Story matches {targetLevel} level — strong signal!
                    </div>
                  )}
                  {levelMatch === "below" && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-amber-400 font-semibold">
                        <AlertTriangle size={18} />
                        Story reads as {result.detectedLevel} — below your{" "}
                        {targetLevel} target
                      </div>
                      <div className="text-xs text-muted-foreground">
                        This is the most common down-leveling reason. Fix it
                        with the rewrite below.
                      </div>
                    </div>
                  )}
                  {levelMatch === "above" && (
                    <div className="flex items-center gap-2 text-blue-400 font-semibold">
                      <ArrowUpCircle size={18} />
                      Story reads above {targetLevel} — excellent signal
                    </div>
                  )}
                </div>
              </div>

              {/* Signal breakdown */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Scope of Impact", value: result.scopeSignal },
                  { label: "Ambiguity Handled", value: result.ambiguitySignal },
                  {
                    label: "Stakeholder Influence",
                    value: result.influenceSignal,
                  },
                  {
                    label: "Driver vs Contributor",
                    value: result.driverSignal,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border"
                  >
                    {SIGNAL_ICON(value)}
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {label}
                      </div>
                      <div
                        className={`text-xs font-semibold capitalize ${SIGNAL_COLOR(value)}`}
                      >
                        {value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rewrite suggestion */}
              {levelMatch !== "match" && (
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10">
                  <div className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-1">
                    <ArrowUpCircle size={13} />
                    How to elevate this story to {targetLevel}
                  </div>
                  <p className="text-sm text-foreground">
                    {result.rewriteSuggestion}
                  </p>
                </div>
              )}

              {/* Detailed coaching */}
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
