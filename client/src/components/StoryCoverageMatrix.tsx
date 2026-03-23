/**
 * #7 — Story Coverage Matrix
 * Shows which Meta values each STAR story covers.
 * Highlights gaps (values with no story) and overlaps (stories covering the same value).
 * Helps candidates ensure full coverage before the interview.
 *
 * Data shape:
 *   BEHAVIORAL_QUESTIONS: { id, area, tier, q, hint }
 *   META_VALUES: { name, desc }
 *   useStarNotes: Record<questionId, string>  (plain text notes)
 *   useBehavioralRatings: Record<questionId, number>
 */
import { useState } from "react";
import { useStarNotes, useBehavioralRatings } from "@/hooks/useLocalStorage";
import { BEHAVIORAL_QUESTIONS, META_VALUES } from "@/lib/data";
import {
  Grid3X3,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

// Map question areas → Meta value names (META_VALUES has no id field)
const AREA_TO_VALUE: Record<string, string> = {
  "Conflict & Influence": "Be Open",
  "Ownership & Accountability": "Focus on Impact",
  "Ambiguity & Complexity": "Move Fast",
  "Cross-functional Leadership": "Build Social Value",
  "Technical Judgment": "Focus on Impact",
  "Failure & Learning": "Move Fast",
  "Mentorship & Growth": "Build Social Value",
  "Strategy & Vision": "Be Bold",
};

export function StoryCoverageMatrix() {
  const [expanded, setExpanded] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    valueName: string;
    qId: string;
  } | null>(null);
  const [starNotes] = useStarNotes();
  const [bqRatings] = useBehavioralRatings();

  // Build coverage map: valueName → { qId: hasStory }
  const coverageMap: Record<string, Record<string, boolean>> = {};
  META_VALUES.forEach(v => {
    coverageMap[v.name] = {};
    BEHAVIORAL_QUESTIONS.filter(q => AREA_TO_VALUE[q.area] === v.name).forEach(
      q => {
        coverageMap[v.name][q.id] = !!starNotes[q.id]?.trim();
      }
    );
  });

  // Coverage stats per value
  const valueCoverage = META_VALUES.map(v => {
    const questions = BEHAVIORAL_QUESTIONS.filter(
      q => AREA_TO_VALUE[q.area] === v.name
    );
    const covered = questions.filter(q => coverageMap[v.name][q.id]).length;
    return { value: v, questions, total: questions.length, covered };
  });

  const totalQuestions = BEHAVIORAL_QUESTIONS.length;
  const totalCovered = BEHAVIORAL_QUESTIONS.filter(q =>
    starNotes[q.id]?.trim()
  ).length;
  const coveragePct =
    totalQuestions > 0 ? Math.round((totalCovered / totalQuestions) * 100) : 0;

  const gapValues = valueCoverage.filter(
    vc => vc.total > 0 && vc.covered === 0
  );
  const weakValues = valueCoverage.filter(
    vc => vc.covered > 0 && vc.covered < vc.total
  );

  return (
    <div
      id="behavioral-story-matrix"
      className="rounded-xl border-2 border-indigo-500/60 bg-gradient-to-br from-indigo-950/40 to-blue-950/30 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(99,102,241,0.12)" }}
    >
      {/* HIGH IMPACT header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500/20 to-blue-500/10 border-b border-indigo-500/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black tracking-wider uppercase">
            ⚡ High Impact
          </span>
          <Grid3X3 size={16} className="text-indigo-400" />
          <span className="text-sm font-bold text-indigo-300">
            Story Coverage Matrix
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!expanded && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Visual map of which Meta values your STAR stories cover. Instantly
            spots gaps before your interview.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div
              className={`text-xs font-bold ${coveragePct >= 80 ? "text-emerald-400" : coveragePct >= 50 ? "text-amber-400" : "text-red-400"}`}
            >
              {coveragePct}% covered
            </div>
            {gapValues.length > 0 && (
              <div className="text-xs text-red-400">
                {gapValues.length} value{gapValues.length > 1 ? "s" : ""} with
                no story
              </div>
            )}
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              View matrix →
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Why this matters */}
          <div className="flex gap-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <AlertTriangle
              size={14}
              className="text-indigo-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-indigo-200">
              <strong>Why this matters:</strong> Candidates who walk in with a
              story for every Meta value never get caught flat-footed. This
              matrix shows your gaps at a glance — fix them before interview
              day.
            </p>
          </div>

          {/* Overall progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Overall story coverage
              </span>
              <span
                className={`font-bold ${coveragePct >= 80 ? "text-emerald-400" : coveragePct >= 50 ? "text-amber-400" : "text-red-400"}`}
              >
                {totalCovered}/{totalQuestions} ({coveragePct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${coveragePct >= 80 ? "bg-emerald-500" : coveragePct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${coveragePct}%` }}
              />
            </div>
          </div>

          {/* Gap alerts */}
          {gapValues.length > 0 && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <XCircle size={12} />
                Critical Gaps — No Story Written
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {gapValues.map(vc => (
                  <span
                    key={vc.value.name}
                    className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-semibold border border-red-500/30"
                  >
                    {vc.value.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {weakValues.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Info size={12} />
                Partial Coverage — More Stories Recommended
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {weakValues.map(vc => (
                  <span
                    key={vc.value.name}
                    className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30"
                  >
                    {vc.value.name} ({vc.covered}/{vc.total})
                  </span>
                ))}
              </div>
            </div>
          )}

          {gapValues.length === 0 && weakValues.length === 0 && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle size={12} />
                Full coverage — you have at least one story for every Meta value
              </div>
            </div>
          )}

          {/* Coverage matrix */}
          <div className="space-y-3">
            {valueCoverage.map(vc => {
              const pct =
                vc.total > 0 ? Math.round((vc.covered / vc.total) * 100) : 0;
              return (
                <div key={vc.value.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {vc.value.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {vc.covered}/{vc.total} stories
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold ${pct === 100 ? "text-emerald-400" : pct > 0 ? "text-amber-400" : "text-red-400"}`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {vc.questions.map(q => {
                      const hasCoverage = coverageMap[vc.value.name][q.id];
                      return (
                        <div
                          key={q.id}
                          className="relative"
                          onMouseEnter={() =>
                            setHoveredCell({
                              valueName: vc.value.name,
                              qId: q.id,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center cursor-default transition-all ${hasCoverage ? "bg-emerald-500/30 border border-emerald-500/50" : "bg-red-500/10 border border-red-500/20 border-dashed"}`}
                          >
                            {hasCoverage ? (
                              <CheckCircle
                                size={12}
                                className="text-emerald-400"
                              />
                            ) : (
                              <XCircle size={12} className="text-red-400/50" />
                            )}
                          </div>
                          {/* Tooltip */}
                          {hoveredCell?.valueName === vc.value.name &&
                            hoveredCell?.qId === q.id && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 w-48 p-2 rounded-lg bg-popover border border-border text-[10px] text-foreground shadow-lg">
                                {q.q}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground">
            Stories are counted from your STAR notes in the Behavioral tab.
            Hover any cell to see the question.
          </p>
        </div>
      )}
    </div>
  );
}
