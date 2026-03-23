/**
 * FeatureHeatmapRow — a compact social-proof bar shown above the top-features
 * section on each tab. Displays "N users today" badges for the most-clicked
 * features so candidates can see which tools are popular.
 */
import { trpc } from "@/lib/trpc";
import { Users, TrendingUp } from "lucide-react";

// Feature key → human label mapping (matches useAnalytics.trackFeatureClick keys)
const FEATURE_LABELS: Record<string, string> = {
  // Coding
  think_out_loud_coach: "Think Out Loud",
  pattern_speed_drill: "Pattern Drill",
  weak_pattern_remediation: "Weak Pattern Fix",
  // Behavioral
  story_coverage_matrix: "Story Matrix",
  interviewer_persona_stress: "Persona Stress Test",
  adversarial_review: "Adversarial Review",
  // System Design
  ai_interviewer_interrupt: "AI Interrupt Mode",
  back_of_envelope: "Back-of-Envelope",
  tear_down_my_design: "Tear Down Design",
  // Overview
  interview_readiness_report: "Readiness Report",
  seven_day_sprint_plan: "Sprint Plan",
  progress_analytics: "Progress Analytics",
};

interface FeatureHeatmapRowProps {
  /** Only show badges for features whose keys include this prefix, or pass all keys */
  featureKeys: string[];
}

export function FeatureHeatmapRow({ featureKeys }: FeatureHeatmapRowProps) {
  const { data } = trpc.analytics.featureClicksToday.useQuery(undefined, {
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const counts = data?.counts ?? {};

  // Filter to only the keys we care about and that have > 0 clicks
  const activeBadges = featureKeys
    .map(key => ({
      key,
      count: counts[key] ?? 0,
      label: FEATURE_LABELS[key] ?? key,
    }))
    .filter(b => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (activeBadges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 py-2 mb-1">
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
        <TrendingUp size={10} className="text-emerald-400" />
        Popular today:
      </span>
      {activeBadges.map(({ key, count, label }) => {
        const intensity =
          count >= 20
            ? "bg-blue-500/15 text-blue-300 border-blue-500/25"
            : count >= 10
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
              : count >= 5
                ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
                : "bg-slate-500/15 text-slate-300 border-slate-500/25";
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${intensity}`}
            title={`${count} candidate${count === 1 ? "" : "s"} used ${label} today`}
          >
            <Users size={9} />
            {label} · {count}
          </span>
        );
      })}
    </div>
  );
}
