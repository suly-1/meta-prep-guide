/**
 * #10 — Personalized Interview Readiness Report
 * Aggregates all local data (pattern ratings, behavioral ratings, STAR notes)
 * and generates a comprehensive readiness report with a go/no-go recommendation.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  usePatternRatings,
  useBehavioralRatings,
  useStarNotes,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS, META_VALUES } from "@/lib/data";
import {
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export function InterviewReadinessReport() {
  const [expanded, setExpanded] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<"go" | "no-go" | "almost" | null>(
    null
  );

  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [starNotes] = useStarNotes();

  const reportMutation = trpc.ai.generateReadinessReport.useMutation();

  // Compute stats
  const ratedPatterns = PATTERNS.filter(
    p => patternRatings[p.id] !== undefined
  );
  const masteredPatterns = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) >= 4
  );
  const weakPatterns = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) <= 2 && patternRatings[p.id] !== undefined
  );
  const avgPatternScore =
    ratedPatterns.length > 0
      ? ratedPatterns.reduce((a, p) => a + (patternRatings[p.id] ?? 0), 0) /
        ratedPatterns.length
      : 0;

  const ratedBQ = BEHAVIORAL_QUESTIONS.filter(
    q => bqRatings[q.id] !== undefined
  );
  const readyBQ = BEHAVIORAL_QUESTIONS.filter(q => (bqRatings[q.id] ?? 0) >= 4);
  const avgBQScore =
    ratedBQ.length > 0
      ? ratedBQ.reduce((a, q) => a + (bqRatings[q.id] ?? 0), 0) / ratedBQ.length
      : 0;

  // A "story" exists if there's any non-empty note for that question
  const storiesWritten = BEHAVIORAL_QUESTIONS.filter(
    q => starNotes[q.id] && starNotes[q.id].trim().length > 0
  ).length;

  // Count distinct behavioral areas covered by stories
  const areasCovered = new Set(
    BEHAVIORAL_QUESTIONS.filter(
      q => starNotes[q.id] && starNotes[q.id].trim().length > 0
    ).map(q => q.area)
  ).size;

  const totalAreas = new Set(BEHAVIORAL_QUESTIONS.map(q => q.area)).size;

  const dataCompleteness = Math.round(
    ((ratedPatterns.length / PATTERNS.length) * 0.3 +
      (ratedBQ.length / BEHAVIORAL_QUESTIONS.length) * 0.3 +
      (storiesWritten / BEHAVIORAL_QUESTIONS.length) * 0.4) *
      100
  );

  async function generateReport() {
    if (dataCompleteness < 20) {
      toast.info(
        "Rate at least 20% of patterns and behavioral questions first to get a meaningful report"
      );
      return;
    }
    try {
      const res = await reportMutation.mutateAsync({
        patterns: PATTERNS.map(p => ({
          id: p.id,
          name: p.name,
          rating: patternRatings[p.id] ?? 0,
        })),
        behavioralQuestions: BEHAVIORAL_QUESTIONS.map(q => ({
          id: q.id,
          q: q.q,
          area: q.area,
          rating: bqRatings[q.id] ?? 0,
          hasStory: !!(starNotes[q.id] && starNotes[q.id].trim().length > 0),
        })),
        metaValues: META_VALUES.map(v => ({ name: v.name })),
        stats: {
          masteredPatterns: masteredPatterns.length,
          weakPatterns: weakPatterns.length,
          totalPatterns: PATTERNS.length,
          avgPatternScore: Math.round(avgPatternScore * 10) / 10,
          readyBQ: readyBQ.length,
          totalBQ: BEHAVIORAL_QUESTIONS.length,
          avgBQScore: Math.round(avgBQScore * 10) / 10,
          storiesWritten,
          valuesCovered: areasCovered,
          totalValues: totalAreas,
        },
      });
      const parsed = JSON.parse(res.content) as {
        score: number;
        verdict: "go" | "no-go" | "almost";
        report: string;
      };
      setReadinessScore(parsed.score);
      setVerdict(parsed.verdict);
      setReport(parsed.report);
    } catch {
      toast.error("Failed to generate report — try again");
    }
  }

  const verdictConfig = {
    go: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      icon: <CheckCircle size={20} className="text-emerald-400" />,
      label: "Ready to Interview",
    },
    almost: {
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/30",
      icon: <Clock size={20} className="text-amber-400" />,
      label: "Almost Ready",
    },
    "no-go": {
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/30",
      icon: <XCircle size={20} className="text-red-400" />,
      label: "More Prep Needed",
    },
  };

  return (
    <div className="rounded-2xl border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-5 shadow-lg">
      {/* HIGH IMPACT badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-500 text-white uppercase tracking-wider">
          ⚡ HIGH IMPACT
        </span>
        <span className="text-xs text-muted-foreground">
          Weekly synthesis · Top 3 action items
        </span>
      </div>

      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
            <FileText size={20} className="text-violet-400" />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">
              #10 — Personalized Interview Readiness Report
            </div>
            <div className="text-xs text-muted-foreground">
              AI synthesizes all your data into a go/no-go verdict + 7-day
              action plan
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {readinessScore !== null && (
            <span
              className={`text-lg font-black ${verdict ? verdictConfig[verdict].color : ""}`}
            >
              {readinessScore}%
            </span>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Data completeness bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Data completeness</span>
              <span
                className={
                  dataCompleteness >= 60
                    ? "text-emerald-400 font-semibold"
                    : dataCompleteness >= 30
                      ? "text-amber-400 font-semibold"
                      : "text-red-400 font-semibold"
                }
              >
                {dataCompleteness}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  dataCompleteness >= 60
                    ? "bg-emerald-500"
                    : dataCompleteness >= 30
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${dataCompleteness}%` }}
              />
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
              <div className="text-lg font-black text-blue-400">
                {masteredPatterns.length}/{PATTERNS.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Patterns mastered
              </div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
              <div className="text-lg font-black text-emerald-400">
                {readyBQ.length}/{BEHAVIORAL_QUESTIONS.length}
              </div>
              <div className="text-xs text-muted-foreground">BQs ready</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
              <div className="text-lg font-black text-violet-400">
                {storiesWritten}/{BEHAVIORAL_QUESTIONS.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Stories written
              </div>
            </div>
          </div>

          {dataCompleteness < 20 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              Rate at least 20% of patterns and behavioral questions first to
              get a meaningful report.
            </div>
          )}

          {/* Verdict display */}
          {verdict && (
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border ${verdictConfig[verdict].bg}`}
            >
              {verdictConfig[verdict].icon}
              <div>
                <div
                  className={`font-bold text-sm ${verdictConfig[verdict].color}`}
                >
                  {verdictConfig[verdict].label}
                </div>
                <div className="text-xs text-muted-foreground">
                  Readiness score: {readinessScore}/100
                </div>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generateReport}
            disabled={reportMutation.isPending || dataCompleteness < 20}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {reportMutation.isPending ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Generating report…
              </>
            ) : report ? (
              <>
                <RefreshCw size={14} />
                Regenerate Report
              </>
            ) : (
              <>
                <FileText size={14} />
                Generate My Readiness Report
              </>
            )}
          </button>

          {/* Report output */}
          {report && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm prose prose-invert max-w-none">
              <Streamdown>{report}</Streamdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
