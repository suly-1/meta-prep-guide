/**
 * 7-Day Sprint Plan Generator
 * Uses AI + readiness data to generate a personalized day-by-day study schedule.
 * Features: AI generation, print/save, share with mentor, sprint-specific feedback.
 */
import { useState, useCallback } from "react";
import {
  Zap,
  Calendar,
  Printer,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Brain,
  Layers,
  Star,
  MessageSquare,
  X,
  RefreshCw,
  Download,
  ExternalLink,
  ThumbsUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  usePatternRatings,
  useBehavioralRatings,
  useStarNotes,
  useMockHistory,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";

// ── Types ──────────────────────────────────────────────────────────────────

interface SprintTask {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  category: "coding" | "behavioral" | "system_design" | "review";
  priority: "high" | "medium" | "low";
  resource?: string;
}

interface SprintDay {
  day: number;
  theme: string;
  focus: string;
  tasks: SprintTask[];
  dailyGoal: string;
  checkIn: string;
}

interface SprintPlanData {
  title: string;
  summary: string;
  targetLevel: string;
  timeline: string;
  days: SprintDay[];
  keyMetrics: {
    totalHours: number;
    codingHours: number;
    behavioralHours: number;
    systemDesignHours: number;
  };
  successCriteria: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  coding: {
    label: "Coding",
    icon: <Code2 size={11} />,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  behavioral: {
    label: "Behavioral",
    icon: <Brain size={11} />,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  system_design: {
    label: "System Design",
    icon: <Layers size={11} />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  review: {
    label: "Review",
    icon: <Star size={11} />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

// ── Feedback Modal ─────────────────────────────────────────────────────────

function SprintFeedbackModal({
  planId,
  onClose,
}: {
  planId?: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = trpc.feedback.submitSprintFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(onClose, 2000);
    },
    onError: () => toast.error("Failed to submit feedback"),
  });

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="prep-card w-full max-w-sm p-6 text-center">
          <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">
            Thanks for your feedback!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your suggestions help improve the sprint plan for everyone.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="prep-card w-full max-w-md p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} className="text-blue-400" />
          <h3
            className="text-sm font-bold text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Rate Your Sprint Plan
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          How useful was this 7-day plan? Your feedback directly improves the AI
          generator for all candidates.
        </p>

        {/* Star rating */}
        <div className="flex gap-1.5 mb-4">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onClick={() => setRating(s)}
              className={`text-2xl transition-all ${
                s <= rating ? "text-amber-400" : "text-muted-foreground/30"
              }`}
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <span className="text-xs text-muted-foreground ml-2 self-center">
              {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
            </span>
          )}
        </div>

        {/* Message */}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="What would make this sprint plan more useful? (e.g., 'Day 3 had too many tasks', 'Need more system design time')"
          className="w-full h-24 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
        />

        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!rating) {
                toast.error("Please select a star rating");
                return;
              }
              if (message.length < 5) {
                toast.error("Please write at least a few words");
                return;
              }
              submitFeedback.mutate({
                sprintPlanId: planId,
                rating,
                message,
              });
            }}
            disabled={submitFeedback.isPending}
            className="flex-1 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Share Modal ────────────────────────────────────────────────────────────

function ShareModal({
  shareToken,
  planTitle,
  onClose,
}: {
  shareToken: string;
  planTitle: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/?sprint=${shareToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard!");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="prep-card w-full max-w-md p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <Share2 size={16} className="text-blue-400" />
          <h3
            className="text-sm font-bold text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Share Sprint Plan
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Share <span className="text-foreground font-medium">{planTitle}</span>{" "}
          with your mentor or study partner. They can view the full plan without
          needing an account.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-muted-foreground font-mono focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all shrink-0"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="flex gap-2">
          <a
            href={`mailto:?subject=My 7-Day Meta Interview Sprint Plan&body=Check out my personalized sprint plan: ${shareUrl}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all"
          >
            <ExternalLink size={11} /> Email
          </a>
          <button
            onClick={() => {
              window.open(
                `https://twitter.com/intent/tweet?text=Just generated my 7-day Meta interview sprint plan! ${shareUrl}`,
                "_blank"
              );
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all"
          >
            <Share2 size={11} /> Post
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Day Card ───────────────────────────────────────────────────────────────

function DayCard({
  day,
  isExpanded,
  onToggle,
}: {
  day: SprintDay;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const totalMinutes = day.tasks.reduce((s, t) => s + t.timeMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const DAY_COLORS = [
    "border-blue-500/30 bg-blue-500/5",
    "border-purple-500/30 bg-purple-500/5",
    "border-emerald-500/30 bg-emerald-500/5",
    "border-amber-500/30 bg-amber-500/5",
    "border-orange-500/30 bg-orange-500/5",
    "border-pink-500/30 bg-pink-500/5",
    "border-cyan-500/30 bg-cyan-500/5",
  ];
  const colorClass = DAY_COLORS[(day.day - 1) % DAY_COLORS.length];

  return (
    <div className={`rounded-xl border ${colorClass} overflow-hidden`}>
      {/* Day header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="shrink-0 w-8 h-8 rounded-lg bg-background/50 border border-border flex items-center justify-center">
          <span className="text-xs font-bold text-foreground">{day.day}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">
              {day.theme}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{day.focus}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock size={9} />
              {hours > 0 ? `${hours}h ` : ""}
              {mins > 0 ? `${mins}m` : ""}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {day.tasks.length} tasks
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
          {/* Tasks */}
          {day.tasks.map(task => {
            const cat =
              CATEGORY_CONFIG[task.category] ?? CATEGORY_CONFIG.review;
            return (
              <div
                key={task.id}
                className={`flex gap-3 p-2.5 rounded-lg border ${cat.border} ${cat.bg}`}
              >
                <div className="shrink-0 mt-0.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${PRIORITY_DOT[task.priority] ?? "bg-secondary"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">
                      {task.title}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${cat.color}`}
                    >
                      {cat.icon} {cat.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {task.timeMinutes}m
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {task.description}
                  </p>
                  {task.resource && (
                    <span className="text-[10px] text-blue-400 mt-0.5 block">
                      → {task.resource}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Daily goal + check-in */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-start gap-2 text-[11px]">
              <CheckCircle2
                size={11}
                className="text-emerald-400 shrink-0 mt-0.5"
              />
              <span className="text-muted-foreground">
                <span className="text-emerald-400 font-semibold">Goal: </span>
                {day.dailyGoal}
              </span>
            </div>
            <div className="flex items-start gap-2 text-[11px]">
              <MessageSquare
                size={11}
                className="text-blue-400 shrink-0 mt-0.5"
              />
              <span className="text-muted-foreground">
                <span className="text-blue-400 font-semibold">Check-in: </span>
                {day.checkIn}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function SevenDaySprintPlan() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [starNotes] = useStarNotes();
  const [mockHistory] = useMockHistory();

  const [targetLevel, setTargetLevel] = useState<"L4" | "L5" | "L6" | "L7">(
    "L6"
  );
  const [timeline, setTimeline] = useState<
    "1-2 weeks" | "3-4 weeks" | "1-2 months" | "3+ months"
  >("3-4 weeks");
  const [planData, setPlanData] = useState<SprintPlanData | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [showFeedback, setShowFeedback] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState<string | undefined>();
  const [shareToken, setShareToken] = useState<string | undefined>();

  // Compute readiness data from localStorage
  const weakPatterns = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) <= 2
  ).map(p => p.name);

  const avgPatternScore =
    PATTERNS.length > 0
      ? PATTERNS.reduce((s, p) => s + (patternRatings[p.id] ?? 0), 0) /
        PATTERNS.length
      : 0;

  const avgBQScore =
    BEHAVIORAL_QUESTIONS.length > 0
      ? BEHAVIORAL_QUESTIONS.reduce((s, q) => s + (bqRatings[q.id] ?? 0), 0) /
        BEHAVIORAL_QUESTIONS.length
      : 0;

  const storiesWritten = Object.values(starNotes).filter(
    n => n && n.trim().length > 20
  ).length;

  const mockSessionsDone = Array.isArray(mockHistory) ? mockHistory.length : 0;

  // Generate mutation
  const generateMutation = trpc.sprintPlan.generate.useMutation({
    onSuccess: data => {
      setPlanData(data.planData as unknown as SprintPlanData);
      setExpandedDays(new Set([1]));
      toast.success("Sprint plan generated!");
    },
    onError: () =>
      toast.error("Failed to generate sprint plan. Please try again."),
  });

  // Save mutation
  const saveMutation = trpc.sprintPlan.save.useMutation({
    onSuccess: data => {
      setSavedPlanId(data.planId);
      setShareToken(data.shareToken);
      toast.success("Plan saved! Share link ready.");
      setShowShare(true);
    },
    onError: () => toast.error("Failed to save plan"),
  });

  const handleGenerate = useCallback(() => {
    generateMutation.mutate({
      targetLevel,
      timeline,
      weakPatterns: weakPatterns.slice(0, 5),
      weakBQAreas: [],
      storiesWritten,
      avgPatternScore,
      avgBQScore,
      mockSessionsDone,
    });
  }, [
    targetLevel,
    timeline,
    weakPatterns,
    storiesWritten,
    avgPatternScore,
    avgBQScore,
    mockSessionsDone,
  ]);

  const handleSaveAndShare = () => {
    if (!planData) return;
    if (shareToken) {
      setShowShare(true);
      return;
    }
    saveMutation.mutate({
      planData: planData as unknown as Record<string, unknown>,
      targetLevel,
      timeline,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleDay = (day: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const expandAll = () => {
    if (planData) {
      setExpandedDays(new Set(planData.days.map(d => d.day)));
    }
  };

  const collapseAll = () => setExpandedDays(new Set());

  return (
    <>
      <div className="prep-card p-5" id="seven-day-sprint-plan">
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Zap size={16} className="text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className="text-base font-bold text-foreground"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                7-Day Sprint Plan Generator
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                AI-POWERED
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Auto-generates a personalized day-by-day study schedule from your
              readiness scores. Print or share with a mentor.
            </p>
          </div>
        </div>

        {/* Config row */}
        <div className="flex flex-wrap gap-3 mb-5 p-3 rounded-xl bg-secondary/30 border border-border">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">
              Target:
            </label>
            <select
              value={targetLevel}
              onChange={e =>
                setTargetLevel(e.target.value as typeof targetLevel)
              }
              className="px-2 py-1 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-blue-500/50"
            >
              <option value="L4">L4 — Software Engineer</option>
              <option value="L5">L5 — Senior Engineer</option>
              <option value="L6">L6 — Staff Engineer</option>
              <option value="L7">L7 — Senior Staff</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">
              Timeline:
            </label>
            <select
              value={timeline}
              onChange={e => setTimeline(e.target.value as typeof timeline)}
              className="px-2 py-1 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-blue-500/50"
            >
              <option value="1-2 weeks">1–2 weeks</option>
              <option value="3-4 weeks">3–4 weeks</option>
              <option value="1-2 months">1–2 months</option>
              <option value="3+ months">3+ months</option>
            </select>
          </div>

          {/* Readiness snapshot */}
          <div className="flex items-center gap-3 ml-auto text-[10px] text-muted-foreground">
            <span>
              Patterns:{" "}
              <span className="text-foreground font-semibold">
                {avgPatternScore.toFixed(1)}/5
              </span>
            </span>
            <span>
              BQ:{" "}
              <span className="text-foreground font-semibold">
                {avgBQScore.toFixed(1)}/5
              </span>
            </span>
            <span>
              Stories:{" "}
              <span className="text-foreground font-semibold">
                {storiesWritten}
              </span>
            </span>
          </div>
        </div>

        {/* Weak patterns notice */}
        {weakPatterns.length > 0 && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-4 text-xs">
            <AlertCircle size={11} className="text-amber-400 shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              <span className="text-amber-400 font-semibold">
                {weakPatterns.length} weak patterns detected:{" "}
              </span>
              {weakPatterns.slice(0, 4).join(", ")}
              {weakPatterns.length > 4 && ` +${weakPatterns.length - 4} more`}.
              The sprint plan will prioritize these.
            </span>
          </div>
        )}

        {/* Generate button */}
        {!planData && (
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Generating your sprint plan...
              </>
            ) : (
              <>
                <Zap size={14} />
                Generate My 7-Day Sprint Plan
              </>
            )}
          </button>
        )}

        {/* Plan output */}
        {planData && (
          <div>
            {/* Plan header */}
            <div className="flex items-start justify-between gap-3 mb-4 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <div>
                <h3
                  className="text-sm font-bold text-foreground"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {planData.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {planData.summary}
                </p>
              </div>
              <button
                onClick={() => {
                  setPlanData(null);
                  setSavedPlanId(undefined);
                  setShareToken(undefined);
                }}
                className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Key metrics */}
            {planData.keyMetrics && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  {
                    label: "Total",
                    value: `${planData.keyMetrics.totalHours}h`,
                    color: "text-foreground",
                  },
                  {
                    label: "Coding",
                    value: `${planData.keyMetrics.codingHours}h`,
                    color: "text-blue-400",
                  },
                  {
                    label: "Behavioral",
                    value: `${planData.keyMetrics.behavioralHours}h`,
                    color: "text-purple-400",
                  },
                  {
                    label: "Sys Design",
                    value: `${planData.keyMetrics.systemDesignHours}h`,
                    color: "text-emerald-400",
                  },
                ].map(m => (
                  <div
                    key={m.label}
                    className="text-center p-2 rounded-lg bg-secondary/30 border border-border"
                  >
                    <div className={`text-sm font-bold ${m.color}`}>
                      {m.value}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action bar */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={expandAll}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Expand all
              </button>
              <span className="text-muted-foreground/30">·</span>
              <button
                onClick={collapseAll}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Collapse all
              </button>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all disabled:opacity-50"
                >
                  <RefreshCw size={10} /> Regenerate
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all"
                >
                  <Printer size={10} /> Print
                </button>
                <button
                  onClick={handleSaveAndShare}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <Share2 size={10} />{" "}
                  {saveMutation.isPending ? "Saving..." : "Share"}
                </button>
                <button
                  onClick={() => setShowFeedback(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all"
                >
                  <ThumbsUp size={10} /> Feedback
                </button>
              </div>
            </div>

            {/* Days */}
            <div className="space-y-2">
              {planData.days.map(day => (
                <DayCard
                  key={day.day}
                  day={day}
                  isExpanded={expandedDays.has(day.day)}
                  onToggle={() => toggleDay(day.day)}
                />
              ))}
            </div>

            {/* Success criteria */}
            {planData.successCriteria &&
              planData.successCriteria.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">
                      Success Criteria
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {planData.successCriteria.map((c, i) => (
                      <li
                        key={i}
                        className="text-[11px] text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-emerald-400 shrink-0">✓</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showFeedback && (
        <SprintFeedbackModal
          planId={savedPlanId}
          onClose={() => setShowFeedback(false)}
        />
      )}
      {showShare && shareToken && planData && (
        <ShareModal
          shareToken={shareToken}
          planTitle={planData.title}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
