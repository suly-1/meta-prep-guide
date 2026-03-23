/**
 * CodePracticeAI — Static version
 * Uses direct OpenAI API calls from the browser (no backend needed).
 * API key stored in localStorage only.
 */
import { useState } from "react";
import {
  Brain,
  Lightbulb,
  MessageSquare,
  Gauge,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  callOpenAI,
  hasOpenAIKey,
  reviewCode,
  getHint,
  generateFollowUps,
} from "@/lib/openai";
import OpenAIKeySetup from "@/components/OpenAIKeySetup";
import {
  useAIReviewHistory,
  type AIReviewRecord,
} from "@/hooks/useLocalStorage";

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  topic: string;
  description: string;
  hints: string[];
}
interface Props {
  problem: Problem;
  code: string;
  language: string;
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({
  label,
  value,
  max = 5,
  color = "bg-blue-500",
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── 1. AI Solution Reviewer ───────────────────────────────────────────────────
export function AISolutionReviewer({ problem, code, language }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [needKey, setNeedKey] = useState(false);
  const [, setHistory] = useAIReviewHistory();

  const handleReview = async () => {
    if (!code.trim()) {
      toast.error("Write some code first.");
      return;
    }
    if (!hasOpenAIKey()) {
      setNeedKey(true);
      setOpen(true);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const text = await reviewCode(code, problem, language);
      setResult(text);
      // Save to history
      const record: AIReviewRecord = {
        id: `${problem.id}-${Date.now()}`,
        problemId: problem.id,
        problemTitle: problem.title,
        topic: problem.topic,
        difficulty: problem.difficulty,
        date: new Date().toISOString(),
        score: 3,
        level: "L6",
        verdict: text.slice(0, 80),
        correctness: 3,
        complexity: 3,
        edgeCases: 3,
        codeQuality: 3,
        coaching: "",
      };
      setHistory(h => [record, ...h].slice(0, 200));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "NO_KEY" || msg === "INVALID_KEY") {
        setNeedKey(true);
      } else {
        toast.error("Review failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-foreground">
            AI Solution Reviewer
          </span>
          <span className="text-xs text-muted-foreground">
            L6/L7 rubric scoring
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-blue-500/10">
          {needKey && (
            <div className="pt-3">
              <OpenAIKeySetup
                onKeySet={() => {
                  setNeedKey(false);
                  handleReview();
                }}
                onDismiss={() => setNeedKey(false)}
              />
            </div>
          )}
          {!needKey && (
            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={handleReview}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold transition-all"
              >
                {loading ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Brain size={11} />
                )}
                {loading ? "Reviewing…" : "Review My Code"}
              </button>
            </div>
          )}
          {result && (
            <div className="rounded-lg bg-background border border-border p-3 text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 2. 3-Level Hint System ────────────────────────────────────────────────────
export function ProgressiveHintSystem({ problem, code }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [hints, setHints] = useState<Array<{ level: number; hint: string }>>(
    []
  );
  const [needKey, setNeedKey] = useState(false);

  const levelLabels = [
    "Pattern Recognition",
    "Approach",
    "Pseudocode Skeleton",
  ];
  const levelColors = [
    "text-amber-400 border-amber-500/30 bg-amber-500/10",
    "text-orange-400 border-orange-500/30 bg-orange-500/10",
    "text-red-400 border-red-500/30 bg-red-500/10",
  ];

  const requestHint = async (level: 1 | 2 | 3) => {
    if (!hasOpenAIKey()) {
      setNeedKey(true);
      return;
    }
    setLoading(true);
    try {
      const hint = await getHint(code, problem, level);
      setHints(h => [...h, { level, hint }]);
      setCurrentLevel(level);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "NO_KEY" || msg === "INVALID_KEY") {
        setNeedKey(true);
      } else {
        toast.error("Failed to get hint.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-400" />
          <span className="text-sm font-semibold text-foreground">
            AI Hint System
          </span>
          <span className="text-xs text-muted-foreground">
            3 progressive levels
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-500/10">
          {needKey && (
            <div className="pt-3">
              <OpenAIKeySetup
                onKeySet={() => {
                  setNeedKey(false);
                }}
                onDismiss={() => setNeedKey(false)}
              />
            </div>
          )}
          <div className="flex gap-2 pt-3">
            {levelLabels.map((label, i) => {
              const level = (i + 1) as 1 | 2 | 3;
              const isUnlocked = currentLevel >= level;
              const isNext = currentLevel === i;
              return (
                <button
                  key={level}
                  onClick={() => isNext && requestHint(level)}
                  disabled={!isNext || loading}
                  className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    isUnlocked
                      ? `${levelColors[i]} opacity-60`
                      : isNext
                        ? `${levelColors[i]} hover:opacity-90`
                        : "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                  }`}
                >
                  {loading && isNext ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <span>L{level}</span>
                  )}
                  <span className="text-[9px] font-normal opacity-80 text-center leading-tight">
                    {label}
                  </span>
                </button>
              );
            })}
            {currentLevel > 0 && (
              <button
                onClick={() => {
                  setHints([]);
                  setCurrentLevel(0);
                }}
                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg"
              >
                Reset
              </button>
            )}
          </div>
          {hints.map((h, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 text-xs ${levelColors[h.level - 1]}`}
            >
              <div className="font-semibold mb-1">
                Level {h.level} — {levelLabels[h.level - 1]}
              </div>
              <div className="text-foreground/80 whitespace-pre-wrap">
                {h.hint}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 3. Follow-Up Question Generator ──────────────────────────────────────────
export function FollowUpGenerator({ problem, code }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [needKey, setNeedKey] = useState(false);

  const handleGenerate = async () => {
    if (!code.trim()) {
      toast.error("Write some code first.");
      return;
    }
    if (!hasOpenAIKey()) {
      setNeedKey(true);
      setOpen(true);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const text = await generateFollowUps(problem, code);
      setResult(text);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "NO_KEY" || msg === "INVALID_KEY") {
        setNeedKey(true);
      } else {
        toast.error("Failed to generate follow-ups.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-purple-400" />
          <span className="text-sm font-semibold text-foreground">
            Follow-Up Generator
          </span>
          <span className="text-xs text-muted-foreground">
            Interviewer follow-ups
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-purple-500/10">
          {needKey && (
            <div className="pt-3">
              <OpenAIKeySetup
                onKeySet={() => {
                  setNeedKey(false);
                  handleGenerate();
                }}
                onDismiss={() => setNeedKey(false)}
              />
            </div>
          )}
          {!needKey && (
            <div className="pt-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {loading ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <MessageSquare size={11} />
                )}
                {loading ? "Generating…" : "Generate Follow-Ups"}
              </button>
            </div>
          )}
          {result && (
            <div className="rounded-lg bg-background border border-border p-3 text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 4. Complexity Analyzer ────────────────────────────────────────────────────
export function ComplexityAnalyzer({ problem, code, language }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [needKey, setNeedKey] = useState(false);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error("Write some code first.");
      return;
    }
    if (!hasOpenAIKey()) {
      setNeedKey(true);
      setOpen(true);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const text = await callOpenAI(
        [
          {
            role: "system",
            content:
              "You are a Meta engineer analyzing time and space complexity. Be precise and concise. Format: Time: O(...) — explanation. Space: O(...) — explanation. Optimal: O(...) — how to achieve it.",
          },
          {
            role: "user",
            content: `Problem: ${problem.title}\n${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
          },
        ],
        { maxTokens: 300 }
      );
      setResult(text);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "NO_KEY" || msg === "INVALID_KEY") {
        setNeedKey(true);
      } else {
        toast.error("Analysis failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">
            Complexity Analyzer
          </span>
          <span className="text-xs text-muted-foreground">
            Time & space analysis
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-emerald-500/10">
          {needKey && (
            <div className="pt-3">
              <OpenAIKeySetup
                onKeySet={() => {
                  setNeedKey(false);
                  handleAnalyze();
                }}
                onDismiss={() => setNeedKey(false)}
              />
            </div>
          )}
          {!needKey && (
            <div className="pt-3">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {loading ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <TrendingUp size={11} />
                )}
                {loading ? "Analyzing…" : "Analyze Complexity"}
              </button>
            </div>
          )}
          {result && (
            <div className="rounded-lg bg-background border border-border p-3 text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Default export: all panels ────────────────────────────────────────────────
export default function CodePracticeAIStatic(props: Props) {
  return (
    <div className="space-y-3">
      <AISolutionReviewer {...props} />
      <ProgressiveHintSystem {...props} />
      <FollowUpGenerator {...props} />
      <ComplexityAnalyzer {...props} />
    </div>
  );
}
