/**
 * Offer Probability Dashboard
 * Aggregates all performance signals into a single % offer probability.
 * Shows exactly which improvements would move the needle most.
 * Not to create anxiety — to make the prep gap concrete and motivating.
 */
import { useMemo } from "react";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  usePatternRatings,
  useBehavioralRatings,
  useStarNotes,
  useMockHistory,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS, META_VALUES } from "@/lib/data";

interface Signal {
  label: string;
  score: number; // 0-100
  weight: number; // relative weight
  gap: string | null; // null if no gap
  action: string | null;
}

function computeSignals(
  patternRatings: Record<string, number>,
  bqRatings: Record<string, number>,
  starNotes: Record<string, string>,
  mockHistory: unknown[]
): Signal[] {
  // 1. Pattern mastery
  const patternScores = PATTERNS.map(p => patternRatings[p.id] ?? 0);
  const avgPattern =
    patternScores.reduce((a, b) => a + b, 0) / patternScores.length;
  const patternPct = Math.round((avgPattern / 5) * 100);
  const weakPatterns = PATTERNS.filter(p => (patternRatings[p.id] ?? 0) <= 2);

  // 2. Behavioral readiness
  const bqScores = BEHAVIORAL_QUESTIONS.map(q => bqRatings[q.id] ?? 0);
  const avgBQ = bqScores.reduce((a, b) => a + b, 0) / bqScores.length;
  const bqPct = Math.round((avgBQ / 5) * 100);

  // 3. Story coverage
  const coveredAreas = new Set(
    BEHAVIORAL_QUESTIONS.filter(q => {
      const note = starNotes[q.id] ?? "";
      return note.trim().length > 30;
    }).map(q => q.area)
  );
  const totalAreas = new Set(BEHAVIORAL_QUESTIONS.map(q => q.area)).size;
  const coveragePct = Math.round((coveredAreas.size / totalAreas) * 100);
  const uncoveredAreas = Array.from(
    new Set(BEHAVIORAL_QUESTIONS.map(q => q.area))
  ).filter(a => !coveredAreas.has(a));

  // 4. Mock session practice
  const mockPct = Math.min(100, Math.round((mockHistory.length / 5) * 100));

  // 5. Meta values coverage
  const metaValuesCovered = META_VALUES.filter(v => {
    const relatedQs = BEHAVIORAL_QUESTIONS.filter(q => q.area === v.name);
    return relatedQs.some(q => (starNotes[q.id] ?? "").trim().length > 30);
  });
  const metaPct = Math.round(
    (metaValuesCovered.length / META_VALUES.length) * 100
  );

  return [
    {
      label: "Coding Pattern Mastery",
      score: patternPct,
      weight: 30,
      gap:
        weakPatterns.length > 0
          ? `${weakPatterns.length} weak pattern${weakPatterns.length > 1 ? "s" : ""}: ${weakPatterns
              .slice(0, 2)
              .map(p => p.name)
              .join(", ")}${weakPatterns.length > 2 ? "..." : ""}`
          : null,
      action:
        weakPatterns.length > 0
          ? `Drill ${weakPatterns[0].name} — use the Weak Pattern Remediation Plan`
          : null,
    },
    {
      label: "Behavioral Readiness",
      score: bqPct,
      weight: 25,
      gap:
        avgBQ < 3.5
          ? `Average rating ${avgBQ.toFixed(1)}/5 — below the hire threshold`
          : null,
      action:
        avgBQ < 3.5
          ? "Rate yourself on 5 more behavioral questions in the Behavioral tab"
          : null,
    },
    {
      label: "STAR Story Coverage",
      score: coveragePct,
      weight: 20,
      gap:
        uncoveredAreas.length > 0
          ? `${uncoveredAreas.length} uncovered area${uncoveredAreas.length > 1 ? "s" : ""}: ${uncoveredAreas.slice(0, 2).join(", ")}`
          : null,
      action:
        uncoveredAreas.length > 0
          ? `Write a STAR story for "${uncoveredAreas[0]}" in the Behavioral tab`
          : null,
    },
    {
      label: "Mock Session Practice",
      score: mockPct,
      weight: 15,
      gap:
        mockHistory.length < 3
          ? `Only ${mockHistory.length} mock session${mockHistory.length !== 1 ? "s" : ""} completed`
          : null,
      action:
        mockHistory.length < 3
          ? "Run a full mock session in the Coding or Behavioral tab"
          : null,
    },
    {
      label: "Meta Values Coverage",
      score: metaPct,
      weight: 10,
      gap:
        metaValuesCovered.length < META_VALUES.length
          ? `${META_VALUES.length - metaValuesCovered.length} Meta value${META_VALUES.length - metaValuesCovered.length > 1 ? "s" : ""} not yet covered`
          : null,
      action:
        metaValuesCovered.length < META_VALUES.length
          ? "Use the Story Coverage Matrix to find and fill gaps"
          : null,
    },
  ];
}

function getGaugeColor(pct: number) {
  if (pct >= 80) return "text-emerald-400";
  if (pct >= 60) return "text-blue-400";
  if (pct >= 40) return "text-amber-400";
  return "text-red-400";
}

function getBarColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 60) return "bg-blue-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function getVerdict(pct: number) {
  if (pct >= 80)
    return {
      label: "Strong Hire Zone",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    };
  if (pct >= 65)
    return {
      label: "Hire Zone",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
    };
  if (pct >= 50)
    return {
      label: "Borderline",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    };
  return {
    label: "Not Ready Yet",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  };
}

export function OfferProbabilityDashboard() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [starNotes] = useStarNotes();
  const [mockHistory] = useMockHistory();

  const signals = useMemo(
    () => computeSignals(patternRatings, bqRatings, starNotes, mockHistory),
    [patternRatings, bqRatings, starNotes, mockHistory]
  );

  // Weighted average
  const totalWeight = signals.reduce((a, s) => a + s.weight, 0);
  const offerProbability = Math.round(
    signals.reduce((a, s) => a + (s.score * s.weight) / totalWeight, 0)
  );

  const verdict = getVerdict(offerProbability);
  const gaps = signals
    .filter(s => s.gap !== null)
    .sort((a, b) => a.score - b.score);

  // Gauge arc calculation
  const radius = 54;
  const circumference = Math.PI * radius; // half circle
  const dashOffset = circumference - (offerProbability / 100) * circumference;

  return (
    <div
      className={`rounded-xl border ${verdict.border} ${verdict.bg} overflow-hidden`}
    >
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center">
            <TrendingUp size={16} className={verdict.color} />
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">
              Offer Probability Dashboard
            </div>
            <div className="text-xs text-muted-foreground">
              Live signal from your actual prep data — updated as you practice
            </div>
          </div>
        </div>

        {/* Gauge */}
        <div className="flex items-center gap-6 mb-4">
          <div
            className="relative flex items-center justify-center"
            style={{ width: 130, height: 70 }}
          >
            <svg width="130" height="70" viewBox="0 0 130 70">
              {/* Background arc */}
              <path
                d="M 10 65 A 55 55 0 0 1 120 65"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-secondary"
                strokeLinecap="round"
              />
              {/* Progress arc */}
              <path
                d="M 10 65 A 55 55 0 0 1 120 65"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className={getGaugeColor(offerProbability)}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div className="absolute bottom-0 text-center">
              <div
                className={`text-2xl font-bold ${getGaugeColor(offerProbability)}`}
              >
                {offerProbability}%
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className={`text-lg font-bold ${verdict.color}`}>
              {verdict.label}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Based on {signals.length} weighted signals from your prep data
            </div>
            {gaps.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Fix top gaps → estimated +{Math.min(25, gaps.length * 8)}%
                improvement
              </div>
            )}
          </div>
        </div>

        {/* Signal breakdown */}
        <div className="space-y-2 mb-4">
          {signals.map(signal => (
            <div key={signal.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-muted-foreground">
                  {signal.label}
                </div>
                <div
                  className={`text-xs font-semibold ${getGaugeColor(signal.score)}`}
                >
                  {signal.score}%
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getBarColor(signal.score)}`}
                  style={{ width: `${signal.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Top action items */}
        {gaps.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-400" />
              Top Actions to Improve Your Score
            </div>
            {gaps.slice(0, 3).map((gap, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-background/50 border border-border"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground font-medium">
                    {gap.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{gap.gap}</div>
                  {gap.action && (
                    <div className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                      <ArrowRight size={10} />
                      {gap.action}
                    </div>
                  )}
                </div>
                <div
                  className={`text-xs font-semibold shrink-0 ${getGaugeColor(gap.score)}`}
                >
                  {gap.score}%
                </div>
              </div>
            ))}
          </div>
        )}

        {gaps.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <div className="text-xs text-emerald-300 font-medium">
              All signals are strong — you're in the offer zone. Keep the
              momentum!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
